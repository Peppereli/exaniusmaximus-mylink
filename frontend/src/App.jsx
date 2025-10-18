import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Briefcase, ChevronLeft, Send, Upload, TrendingUp, Zap, Loader2, CheckCircle, AlertTriangle, User, MessageSquare, CornerDownLeft } from 'lucide-react';

// --- Environment Variables & Constants ---
// 'appId' is assigned but never used, so we remove the definition to fix the warning.
const __app_id = process.env.REACT_APP_APP_ID || 'exanius-default-id';
// const appId = __app_id; // Removed: 'appId' is assigned a value but never used
const apiKey = ""; 

// --- Configuration ---
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';
const API_URL = `${API_BASE_URL}?key=${apiKey}`;

// Russian Text Constants
const RU = {
    TITLE: "SmartBot - Умный помощник для карьеры",
    HERO_H1: "Умный помощник для вашей карьеры",
    HERO_P: "SmartBot анализирует ваши данные и предпочтения, чтобы найти идеальную работу или сотрудника с максимальной вероятностью совпадения.",
    BTN_JOB_SEEKER: "Я ищу работу",
    BTN_HR: "Я ищу сотрудника",
    QUESTIONNAIRE_JOB: "Анкета соискателя",
    QUESTIONNAIRE_HR: "Анкета компании",
    UPLOAD_RESUME: "Загрузите ваше резюме",
    UPLOAD_VACANCY: "Загрузите описание вакансии",
    BTN_ANALYZE_JOB: "Найти подходящие компании",
    BTN_ANALYZE_HR: "Найти подходящих кандидатов",
    BACK: "Назад",
    NEXT: "Далее →",
    FILE_DROP: "Перетащите файл сюда",
    FILE_OR_CLICK: "или нажмите для выбора файла",
    SELECT_FILE: "Выбрать файл",
    MATCH_TEXT: "Совпадение с вашими требованиями",
    RECOMMENDATIONS_TITLE: "Рекомендации по улучшению",
    NEW_SEARCH: "Новый поиск",
    LOADING: "Анализ данных..."
};

// --- Structured Response Schema for Gemini ---
const RESULT_SCHEMA = {
    type: "OBJECT",
    properties: {
        matchPercentage: { type: "INTEGER", description: "Overall match score (0-100)." },
        matchText: { type: "STRING", description: "A brief summary of the match, e.g., 'Высокое совпадение с вашими навыками'." },
        recommendations: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "A list of concrete, actionable recommendations for improvement, based on the uploaded content and questionnaire."
        },
        matches: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING", description: "Job title or Candidate name." },
                    secondary: { type: "STRING", description: "Company or Position." },
                    location: { type: "STRING", description: "City or region." },
                    salary: { type: "STRING", description: "Salary range or current experience level." },
                    match: { type: "INTEGER", description: "Specific match score for this item (0-100)." },
                    description: { type: "STRING", description: "Brief description/summary from the source file." }
                },
                required: ["title", "secondary", "location", "match", "description"]
            }
        }
    },
    required: ["matchPercentage", "matchText", "recommendations", "matches"]
};

// --- System Prompts ---
const getSystemPrompt = (userType, formData, chatContext = "") => {
    const common = `You are Exanius, a professional career analysis expert. Your task is to analyze the provided text content (a resume or a job description) against the user's preferences, which are provided below. Based on this analysis, generate a structured JSON response following the provided schema. All text in the response, including recommendation points and match descriptions, MUST be in Russian.`;

    const contextString = chatContext ? `\n\nADDITIONAL CONTEXT FROM USER CHAT FOR REFINEMENT: ${chatContext}` : "";

    if (userType === 'jobSeeker') {
        return `${common}
        USER ROLE: Job Seeker.
        TASK: Evaluate the uploaded Resume/CV and the user's stated preferences. Use the additional context from the chat to refine the job matches (e.g., location, industry, specific skills).
        PREFERENCES: ${JSON.stringify(formData)}${contextString}
        Instructions: 
        1. Calculate a general match percentage based on the CV's content matching current job market trends and the user's desires.
        2. Generate 3 example Job Matches (titles, companies, salaries, locations, match scores) that suit the CV and refined preferences.
        3. Provide 3-5 concrete recommendations for improving the RESUME/CV.`;
    }

    // HR - simpler prompt for direct analysis
    return `${common}
    USER ROLE: HR/Recruiter.
    TASK: Evaluate the uploaded Job Description and the company's stated preferences.
    PREFERENCES: ${JSON.stringify(formData)}
    Instructions: 
    1. Calculate a general match percentage based on the Job Description's competitiveness and clarity.
    2. Generate 3 example Candidate Matches (names, positions, experience, locations, match scores) that suit the vacancy.
    3. Provide 3-5 concrete recommendations for improving the VACANCY DESCRIPTION.`;
};


// --- Component ---
const App = () => {
    const [view, setView] = useState('hero');
    const [userType, setUserType] = useState(null); // 'jobSeeker' or 'hr'
    const [formData, setFormData] = useState({});
    const [file, setFile] = useState(null);
    const [fileContent, setFileContent] = useState(null);
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', text: 'Ваше резюме успешно загружено! Для более точного подбора вакансий, пожалуйста, расскажите, что еще для вас важно. Например: "Я ищу роли, где могу использовать Python и работать над проектами в сфере Fintech."' }
    ]);

    const fileInputRef = useRef(null);

    // --- Utility Functions ---

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'pdf': 'PDF Document',
            'docx': 'Word Document',
            'doc': 'Word Document',
            'txt': 'Text File'
        };
        return types[ext] || 'Unknown File Type';
    };

    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject("No file provided.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file); 
        });
    };

    const resetAll = useCallback(() => {
        setView('hero');
        setUserType(null);
        setFormData({});
        setFile(null);
        setFileContent(null);
        setResults(null);
        setIsLoading(false);
        setError(null);
        setChatHistory([
            { role: 'model', text: 'Ваше резюме успешно загружено! Для более точного подбора вакансий, пожалуйста, расскажите, что еще для вас важно. Например: "Я ищу роли, где могу использовать Python и работать над проектами в сфере Fintech."'}
        ]);
    }, []);

    // --- API Call Function (Wrapped in useCallback) ---

    const analyzeFile = useCallback(async (chatContext = "") => {
        if (!fileContent || isLoading) return;

        setIsLoading(true);
        setError(null);

        const fullPrompt = `Analyze the document content provided below, keeping the user's preferences in mind.
        Preferences: ${JSON.stringify(formData, null, 2)}
        
        Document Content:
        --- START OF DOCUMENT ---
        ${fileContent.substring(0, 10000)}
        --- END OF DOCUMENT ---
        
        Generate the structured JSON response as instructed by the system prompt.`;

        // Pass chatContext to system prompt for refinement
        const systemPrompt = getSystemPrompt(userType, formData, chatContext);

        const payload = {
            contents: [{ parts: [{ text: fullPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: RESULT_SCHEMA,
            },
        };

        try {
            let finalResult = null;
            // Exponential backoff logic
            for (let attempt = 0; attempt < 3; attempt++) {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (jsonText) {
                        finalResult = JSON.parse(jsonText);
                        break; // Success
                    }
                } else if (response.status === 429) {
                    // Rate limit exceeded, wait longer
                    if (attempt < 2) {
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                        continue;
                    }
                }
                
                throw new Error(`API call failed after ${attempt + 1} attempts. Status: ${response.status}`);
            }
            
            if (finalResult) {
                setResults(finalResult);
                setView('results');
            }

        } catch (e) {
            console.error("Analysis Error:", e);
            setError("Ошибка при анализе данных. Убедитесь, что ваш файл содержит достаточно текста, и повторите попытку.");
        } finally {
            setIsLoading(false);
        }
    }, [fileContent, formData, userType, isLoading]); // Dependencies for useCallback

    // --- UI Components ---

    const Button = ({ children, primary, onClick, disabled = false, type = 'button', className = '' }) => (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`btn p-4 rounded-xl font-semibold shadow-lg transition duration-300 transform active:scale-[.98]
                ${primary ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white'}
                ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:translate-y-[-2px]'} ${className}
            `}
        >
            {children}
        </button>
    );

    const Header = () => (
        <header className="bg-white shadow-lg p-4 border-b border-gray-100">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center text-xl font-bold text-gray-800">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-lg mr-2 shadow-md">
                        S
                    </div>
                    {RU.TITLE.split(' - ')[0]}
                </div>
                <nav className="hidden sm:block">
                    <ul className="flex space-x-6 list-none">
                        <li><a href="/" className="text-gray-600 hover:text-amber-500 font-medium transition duration-150">Главная</a></li>
                        <li><a href="/" className="text-gray-600 hover:text-amber-500 font-medium transition duration-150">Для соискателей</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    );

    const HeroView = () => (
        <section className="bg-gray-50 py-24 rounded-b-3xl">
            <div className="max-w-4xl mx-auto text-center px-4">
                <h1 className="text-5xl font-extrabold text-gray-800 mb-6">{RU.HERO_H1}</h1>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">{RU.HERO_P}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-5">
                    <Button primary onClick={() => { setUserType('jobSeeker'); setView('questionnaire'); }}>
                        <Briefcase className="w-5 h-5 mr-2 inline" /> {RU.BTN_JOB_SEEKER}
                    </Button>
                    <Button onClick={() => { setUserType('hr'); setView('questionnaire'); }}>
                        <User className="w-5 h-5 mr-2 inline" /> {RU.BTN_HR}
                    </Button>
                </div>
            </div>
        </section>
    );

    const OptionSelector = ({ label, name, options }) => {
        const handleSelect = (value) => {
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">{label}</h3>
                <div className="flex flex-wrap gap-3">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`px-4 py-2 rounded-full text-sm cursor-pointer transition duration-150 border-2 
                                ${formData[name] === option.value
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                    : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-gray-200'
                                }`
                            }
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
                {/* Validation check */}
                {!formData[name] && <span className="text-red-500 text-xs mt-1 block">Обязательное поле</span>}
            </div>
        );
    };

    const QuestionnaireView = () => {
        const isJobSeeker = userType === 'jobSeeker';
        const title = isJobSeeker ? RU.QUESTIONNAIRE_JOB : RU.QUESTIONNAIRE_HR;

        const questions = isJobSeeker
            ? [
                { name: 'desiredSalary', label: '1. Какую зарплату вы ожидаете? (руб.)', type: 'number', placeholder: "Введите сумму" },
                { name: 'relocation', label: '2. Готовы ли вы к переезду в другой город?', options: [{ label: 'Да, готов', value: 'yes' }, { label: 'Нет, не готов', value: 'no' }, { label: 'Рассмотрю предложения', value: 'maybe' }] },
                { name: 'workFormat', label: '3. Какой формат работы предпочитаете?', options: [{ label: 'Офис', value: 'office' }, { label: 'Удалённо', value: 'remote' }, { label: 'Гибридный', value: 'hybrid' }] },
                { name: 'workSchedule', label: '4. Какой график работы вас интересует?', options: [{ label: 'Полный день', value: 'full' }, { label: 'Неполный день', value: 'part' }, { label: 'Гибкий график', value: 'flexible' }, { label: 'Сменный график', value: 'shift' }] },
            ]
            : [
                { name: 'offeredSalary', label: '1. Какую зарплату предлагаете? (руб.)', type: 'number', placeholder: "Введите сумму" },
                { name: 'candidateRelocation', label: '2. Готовы рассматривать кандидатов из других городов?', options: [{ label: 'Да', value: 'yes' }, { label: 'Только локальные', value: 'no' }, { label: 'С компенсацией переезда', value: 'relocation' }] },
                { name: 'offeredWorkFormat', label: '3. Какой формат работы предлагаете?', options: [{ label: 'Офис', value: 'office' }, { label: 'Удалённо', value: 'remote' }, { label: 'Гибридный', value: 'hybrid' }] },
                { name: 'offeredWorkSchedule', label: '4. Какой график работы предлагаете?', options: [{ label: 'Полный день', value: 'full' }, { label: 'Неполный день', value: 'part' }, { label: 'Гибкий график', value: 'flexible' }, { label: 'Сменный график', value: 'shift' }] },
            ];

        const handleSubmit = (e) => {
            e.preventDefault();
            // Simple validation: check if all fields are present in formData
            const requiredFields = questions.map(q => q.name);
            const isComplete = requiredFields.every(field => formData[field] && formData[field].toString().trim() !== '');

            if (isComplete) {
                setView('upload');
            } else {
                console.error("Пожалуйста, ответьте на все вопросы перед продолжением.");
                setError("Пожалуйста, ответьте на все вопросы перед продолжением.");
            }
        };

        return (
            <section className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl">
                        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">{title}</h2>
                        <form onSubmit={handleSubmit}>
                            {questions.map(q => (
                                q.type === 'number' ? (
                                    <div key={q.name} className="mb-6">
                                        <label className="block text-lg font-semibold mb-3 text-gray-700" htmlFor={q.name}>{q.label}</label>
                                        <input
                                            id={q.name}
                                            type="number"
                                            placeholder={q.placeholder}
                                            value={formData[q.name] || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, [q.name]: e.target.value }))}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <OptionSelector key={q.name} label={q.label} name={q.name} options={q.options} />
                                )
                            ))}
                            {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> {error}</div>}
                            <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
                                <Button onClick={() => setView('hero')} primary={false}>
                                    <ChevronLeft className="w-5 h-5 mr-1 inline" /> {RU.BACK}
                                </Button>
                                <Button type="submit" primary>
                                    {RU.NEXT} <ChevronLeft className="w-5 h-5 ml-1 inline transform rotate-180" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        );
    };

    const UploadView = () => {
        const isJobSeeker = userType === 'jobSeeker';
        const uploadText = isJobSeeker ? RU.UPLOAD_RESUME : RU.UPLOAD_VACANCY;

        const handleFileChange = async (selectedFile) => {
            if (!selectedFile) return;

            if (selectedFile.size > 1024 * 500) { // Limit file size to 500KB
                setError("Файл слишком большой. Максимальный размер 500 КБ.");
                return;
            }
            
            setFile(selectedFile);
            setError(null);
            
            try {
                const content = await readFileContent(selectedFile);
                setFileContent(content);
            } catch (e) {
                setError("Ошибка чтения файла. Поддерживаются только текстовые файлы (.txt).");
                setFile(null);
                setFileContent(null);
            }
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-amber-500', 'bg-amber-50');
            if (e.dataTransfer.files.length) {
                handleFileChange(e.dataTransfer.files[0]);
            }
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-amber-500', 'bg-amber-50');
        };

        const handleDragLeave = (e) => {
            e.currentTarget.classList.remove('border-amber-500', 'bg-amber-50');
        };

        // HR skips chat and goes straight to analysis
        const nextStepAction = isJobSeeker ? () => setView('chat') : () => analyzeFile(""); 
        const nextStepText = isJobSeeker ? "Перейти к чату" : RU.BTN_ANALYZE_HR;


        return (
            <section className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">{uploadText}</h2>
                    <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl">
                        <div
                            className={`border-4 border-dashed rounded-xl p-12 text-center transition duration-300 cursor-pointer
                                ${file ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-amber-500 hover:bg-amber-50'}
                            `}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <Upload className={`w-12 h-12 mx-auto mb-4 ${file ? 'text-green-600' : 'text-gray-400'}`} />
                            {file ? (
                                <div className="text-lg font-semibold text-green-700 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 mr-2" /> Файл загружен!
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-800">{RU.FILE_DROP}</h3>
                                    <p className="text-gray-500 mb-6">{RU.FILE_OR_CLICK}</p>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".txt" // Only allow simple text files for robust content reading
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileChange(e.target.files[0])}
                            />
                            <Button onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }} primary={!file}>
                                {RU.SELECT_FILE}
                            </Button>
                        </div>
                        
                        {file && (
                            <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner">
                                <p className="font-medium text-gray-700"><strong>Файл:</strong> {file.name}</p>
                                <p className="text-sm text-gray-500"><strong>Размер:</strong> {formatFileSize(file.size)}</p>
                                <p className="text-sm text-gray-500"><strong>Тип:</strong> {getFileType(file.name)}</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                            </div>
                        )}

                        <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
                            <Button onClick={() => setView('questionnaire')} primary={false}>
                                <ChevronLeft className="w-5 h-5 mr-1 inline" /> {RU.BACK}
                            </Button>
                            <Button onClick={nextStepAction} primary disabled={!fileContent || (isJobSeeker === false && isLoading)}>
                                {isLoading && !isJobSeeker ? (
                                    <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                                ) : (
                                    <MessageSquare className="w-5 h-5 mr-2 inline" />
                                )}
                                {isLoading && !isJobSeeker ? RU.LOADING : nextStepText}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    const ChatView = () => {
        const [currentMessage, setCurrentMessage] = useState('');
        const chatContainerRef = useRef(null);
        const isJobSeeker = userType === 'jobSeeker';

        // Scroll to bottom on new message
        useEffect(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, [chatHistory]);

        // FIXED: Added analyzeFile to dependency array for exhaustive-deps compliance
        useEffect(() => {
            // HR skips chat and goes straight to analysis (triggered once on mount)
            const isHR = !isJobSeeker;

            // The logic runs ONLY if the user is HR AND the analysis hasn't started/finished
            if (isHR && !results && !isLoading) {
                analyzeFile(""); // Start analysis for HR immediately
            }
        }, [analyzeFile, results, isLoading, isJobSeeker]); // analyzeFile is now correctly included
        
        // If HR and loading, show loading screen and exit the function early.
        if (!isJobSeeker && isLoading) {
            return (
                <div className="flex items-center justify-center h-64 bg-gray-50">
                    <Loader2 className="w-8 h-8 mr-2 inline animate-spin text-cyan-500" /> 
                    <span className="text-xl text-cyan-500">{RU.LOADING}</span>
                </div>
            );
        }

        // Function to handle conversational chat with Gemini (no structured output)
        const handleChatSubmit = async (e) => {
            e.preventDefault();
            if (!currentMessage.trim() || isLoading) return;

            const userMessage = currentMessage.trim();
            setCurrentMessage('');
            setIsLoading(true);
            setError(null);

            // 1. Update history with user message
            const newHistory = [...chatHistory, { role: 'user', text: userMessage }];
            setChatHistory(newHistory);
            
            // 2. Prepare chat history for API call
            const apiHistory = newHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            // 3. System instruction for chat: conversational, focus on gathering requirements
            const chatSystemPrompt = `You are SmartBot, a helpful and engaging career refinement assistant. Your goal is to gather additional, specific requirements from the user (Job Seeker) to improve job vacancy matching. Do not perform the final analysis yet. Ask clarifying questions about industry, preferred company size, specific tech stacks, or cultural fit. Keep responses concise and encouraging. The user has already uploaded their CV and answered initial questions about salary and work format.`;

            const payload = {
                contents: apiHistory,
                systemInstruction: { parts: [{ text: chatSystemPrompt }] },
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    const modelResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Извините, я не смог получить ответ.";
                    setChatHistory(prev => [...prev, { role: 'model', text: modelResponseText }]);
                } else {
                    throw new Error(`Chat API error: ${response.status}`);
                }

            } catch (e) {
                console.error("Chat Error:", e);
                setError("Ошибка связи с Gemini. Пожалуйста, попробуйте позже.");
                // Revert history
                setChatHistory(newHistory.slice(0, newHistory.length - 1));
            } finally {
                setIsLoading(false);
            }
        };
        
        // Function to start the final structured analysis
        const startFinalAnalysis = () => {
            // Collect all user messages to send as context for the final structured analysis
            const userChatContext = chatHistory
                .filter(msg => msg.role === 'user')
                .map(msg => msg.text)
                .join(' | ');
                
            analyzeFile(userChatContext);
        };


        const ChatBubble = ({ role, text }) => {
            const isUser = role === 'user';
            return (
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className={`max-w-[75%] p-4 rounded-xl shadow-md ${isUser ? 'bg-amber-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                        <p className="whitespace-pre-wrap">{text}</p>
                    </div>
                </div>
            );
        };
        
        // Job Seeker Chat UI (This is the main return for the job seeker)
        return (
            <section className="py-16 bg-gray-50">
                <div className="max-w-xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[70vh] min-h-[500px]">
                        
                        <h3 className="p-4 text-center font-bold text-lg text-gray-800 bg-cyan-50 border-b border-cyan-100 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-cyan-600" /> Редактор требований SmartBot
                        </h3>

                        {/* Chat Window */}
                        <div ref={chatContainerRef} className="flex-grow p-6 overflow-y-auto bg-white border-b border-gray-100">
                            {chatHistory.map((msg, index) => (
                                <ChatBubble key={index} role={msg.role} text={msg.text} />
                            ))}
                            {isLoading && (
                                <div className="flex justify-start mb-4">
                                    <div className="max-w-[75%] p-4 rounded-xl shadow-md bg-gray-100 text-gray-800 rounded-tl-none flex items-center">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-cyan-600" />
                                        <span>SmartBot печатает...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {error && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center m-4">
                                <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                            </div>
                        )}
                        
                        {/* Chat Input Form */}
                        <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-100 flex items-center">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 mr-3"
                                placeholder="Спросите SmartBot о требованиях..."
                                disabled={isLoading}
                            />
                            <Button type="submit" primary disabled={!currentMessage.trim() || isLoading} className="h-full px-5 py-3">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
                        </form>

                        {/* FIXED: Added button to start final analysis for Job Seeker */}
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <Button onClick={startFinalAnalysis} primary className="!bg-cyan-500 hover:!bg-cyan-600" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                                ) : (
                                    <TrendingUp className="w-5 h-5 mr-2 inline" />
                                )}
                                {isLoading ? RU.LOADING : RU.BTN_ANALYZE_JOB}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    const ResultCard = ({ item, isJobSeeker }) => {
        const MatchIcon = item.match > 80 ? Zap : item.match > 60 ? TrendingUp : AlertTriangle;
        const color = item.match > 80 ? 'text-green-600' : item.match > 60 ? 'text-amber-500' : 'text-red-500';
        const bgColor = item.match > 80 ? 'bg-green-50' : item.match > 60 ? 'bg-amber-50' : 'bg-red-50';

        return (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                        {item.title}
                    </h3>
                    <div className={`flex items-center text-sm font-bold p-2 rounded-full ${bgColor} ${color}`}>
                        <MatchIcon className="w-4 h-4 mr-1" />
                        {item.match}%
                    </div>
                </div>
                <p className="text-gray-600 mb-2">
                    {isJobSeeker ? item.secondary : `Позиция: ${item.secondary}`}
                </p>
                <div className="text-sm text-gray-500 mb-3">
                    <span>{item.location}</span> &bull; <span>{item.salary}</span>
                </div>
                <p className="text-sm text-gray-700 italic border-l-4 border-cyan-200 pl-3">
                    {item.description}
                </p>
            </div>
        );
    };

    const ResultsView = () => {
        if (!results) return null;
        const isJobSeeker = userType === 'jobSeeker';
        const matchesTitle = isJobSeeker ? 'Подходящие вакансии' : 'Подходящие кандидаты';
        const overallMatchColor = results.matchPercentage > 80 ? 'text-green-500' : results.matchPercentage > 60 ? 'text-amber-500' : 'text-red-500';

        return (
            <section className="py-16 bg-gray-50 min-h-[80vh]">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl">
                        
                        <h2 className="text-4xl font-extrabold text-center mb-4 text-gray-800">
                            Результаты анализа
                        </h2>
                        
                        {/* Overall Match Summary */}
                        <div className={`p-6 rounded-xl text-center shadow-inner mb-10 ${overallMatchColor} bg-opacity-10`} style={{ backgroundColor: `${overallMatchColor.replace('text-', '').replace('500', '100')}` }}>
                            <p className="text-xl font-semibold mb-2">{RU.MATCH_TEXT}:</p>
                            <p className="text-6xl font-black mb-2">{results.matchPercentage}%</p>
                            <p className="text-lg italic">{results.matchText}</p>
                        </div>
                        
                        {/* Matches Section */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{matchesTitle}</h3>
                        <div className="space-y-6 mb-10">
                            {results.matches.map((item, index) => (
                                <ResultCard key={index} item={item} isJobSeeker={isJobSeeker} />
                            ))}
                        </div>

                        {/* Recommendations Section */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center">
                            <Zap className="w-6 h-6 mr-2 text-cyan-600" /> {RU.RECOMMENDATIONS_TITLE}
                        </h3>
                        <ul className="list-disc list-inside space-y-3 pl-5 text-gray-700">
                            {results.recommendations.map((rec, index) => (
                                <li key={index}>
                                    <span className="font-medium text-cyan-600">Совет {index + 1}:</span> {rec}
                                </li>
                            ))}
                        </ul>

                        {/* Navigation */}
                        <div className="pt-6 border-t border-gray-100 mt-10 flex justify-center">
                            <Button onClick={resetAll} primary>
                                {RU.NEW_SEARCH}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    // --- Main Render Logic ---

    let content;
    switch (view) {
        case 'hero':
            content = <HeroView />;
            break;
        case 'questionnaire':
            content = <QuestionnaireView />;
            break;
        case 'upload':
            content = <UploadView />;
            break;
        case 'chat':
            content = <ChatView />;
            break;
        case 'results':
            content = <ResultsView />;
            break;
        default:
            content = <HeroView />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header />
            <main>
                {content}
            </main>
        </div>
    );
};

export default App;
