// Variables to track survey state
let currentSurvey = null;
let currentQuestionIndex = 0;
let responses = {};
let surveyShown = false;

// Mock survey data for testing without PostHog
const mockSurvey = {
    id: 'mock-survey-1',
    name: 'Customer Feedback Survey',
    description: 'We value your feedback. Please take a moment to complete this survey.',
    questions: [
        {
            id: 'q1',
            question: 'How satisfied are you with our product?',
            type: 'rating',
            scale: 5
        },
        {
            id: 'q2',
            question: 'Which features do you use the most?',
            type: 'multiple_choice',
            choices: ['Analytics', 'Feature Flags', 'Session Recording', 'A/B Testing', 'Surveys']
        },
        {
            id: 'q3',
            question: 'What could we improve?',
            type: 'open_text'
        }
    ]
};

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener to reset button
    const resetBtn = document.getElementById('reset-survey-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSurvey);
    }

    // Register PostHog survey loaded listener
    if (typeof posthog !== 'undefined') {
        posthog.onSurveysLoaded(() => {
            console.log('PostHog surveys loaded');
            fetchSurveys();
        });
    } else {
        // If PostHog is not available, use mock data after a short delay
        console.log('PostHog not detected, using mock data');
        setTimeout(() => {
            handleSurveys([mockSurvey]);
        }, 1000);
    }
});

// Reset the survey
function resetSurvey() {
    // Reset survey state
    currentSurvey = null;
    currentQuestionIndex = 0;
    responses = {};
    surveyShown = false;
    
    // Reset the UI
    const surveyContainer = document.getElementById('survey-container');
    surveyContainer.innerHTML = `
        <div class="loading-spinner" id="loading">
            <div class="spinner"></div>
        </div>
    `;

    // Re-fetch the surveys
    fetchSurveys();
}

// Fetch surveys from PostHog
function fetchSurveys() {
    if (typeof posthog !== 'undefined') {
        posthog.getActiveMatchingSurveys((surveys) => {
            if (surveys && surveys.length > 0) {
                handleSurveys(surveys);
            } else {
                // If no surveys from PostHog, fall back to mock data
                handleSurveys([mockSurvey]);
            }
        });
    } else {
        // If PostHog is not available, use mock data
        handleSurveys([mockSurvey]);
    }
}

// Handle surveys response
function handleSurveys(surveys) {
    const surveyContainer = document.getElementById('survey-container');
    const loadingElement = document.getElementById('loading');
    
    // Remove loading spinner
    if (loadingElement) {
        loadingElement.remove();
    }

    // Check if we have any surveys
    if (!surveys || surveys.length === 0) {
        surveyContainer.innerHTML = `
            <div class="survey-header">
                <h2>No surveys available</h2>
            </div>
            <div class="survey-description">
                There are no active surveys for you at the moment.
            </div>
        `;
        return;
    }

    // Take the first survey
    currentSurvey = surveys[0];
    console.log('Survey loaded:', currentSurvey);

    // Initialize survey UI
    initializeSurveyUI();
}

// Initialize survey UI
function initializeSurveyUI() {
    const surveyContainer = document.getElementById('survey-container');
    
    // Create survey header
    const surveyHeader = document.createElement('div');
    surveyHeader.className = 'survey-header';
    surveyHeader.innerHTML = `
        <h2>${currentSurvey.name || 'Feedback Survey'}</h2>
    `;
    
    // Create survey description
    const surveyDescription = document.createElement('div');
    surveyDescription.className = 'survey-description';
    surveyDescription.textContent = currentSurvey.description || 'We value your feedback. Please take a moment to complete this survey.';
    
    // Clear the container and add the header and description
    surveyContainer.innerHTML = '';
    surveyContainer.appendChild(surveyHeader);
    surveyContainer.appendChild(surveyDescription);
    
    // Add the first question
    displayQuestion(0);
    
    // Track that the survey was shown
    captureShownEvent();
}

// Display a specific question
function displayQuestion(questionIndex) {
    if (!currentSurvey || !currentSurvey.questions || questionIndex >= currentSurvey.questions.length) {
        return;
    }

    currentQuestionIndex = questionIndex;
    const question = currentSurvey.questions[questionIndex];
    const surveyContainer = document.getElementById('survey-container');
    
    // Create question container
    const questionContainer = document.createElement('div');
    questionContainer.className = 'question';
    questionContainer.id = `question-${questionIndex}`;
    
    // Create question text
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.textContent = question.question;
    questionContainer.appendChild(questionText);
    
    // Create input based on question type
    let inputWrapper;
    switch (question.type) {
        case 'open':
        case 'open_text':
            inputWrapper = createOpenTextInput(question);
            break;
        case 'rating':
            inputWrapper = createRatingInput(question);
            break;
        case 'single_choice':
            inputWrapper = createSingleChoiceInput(question);
            break;
        case 'multiple_choice':
            inputWrapper = createMultipleChoiceInput(question);
            break;
        default:
            inputWrapper = createOpenTextInput(question);
    }
    
    questionContainer.appendChild(inputWrapper);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Add dismiss button
    const dismissButton = document.createElement('button');
    dismissButton.className = 'secondary';
    dismissButton.textContent = 'Dismiss';
    dismissButton.addEventListener('click', handleDismiss);
    buttonContainer.appendChild(dismissButton);
    
    // Add navigation buttons
    if (questionIndex > 0) {
        const prevButton = document.createElement('button');
        prevButton.className = 'secondary';
        prevButton.textContent = 'Previous';
        prevButton.addEventListener('click', () => navigateQuestion(-1));
        buttonContainer.appendChild(prevButton);
    }
    
    const nextButton = document.createElement('button');
    nextButton.textContent = questionIndex < currentSurvey.questions.length - 1 ? 'Next' : 'Submit';
    nextButton.addEventListener('click', () => handleNextOrSubmit());
    buttonContainer.appendChild(nextButton);
    
    questionContainer.appendChild(buttonContainer);
    
    // Find and remove any existing question
    const existingQuestion = document.querySelector('.question');
    if (existingQuestion) {
        existingQuestion.remove();
    }
    
    // Add the question to the survey container
    surveyContainer.appendChild(questionContainer);
}

// Create an open text input
function createOpenTextInput(question) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper textarea-container';
    
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Type your answer here...';
    textarea.id = `response-${question.id}`;
    
    // If we have a saved response, populate it
    if (responses[question.id]) {
        textarea.value = responses[question.id];
    }
    
    inputWrapper.appendChild(textarea);
    return inputWrapper;
}

// Create a rating input
function createRatingInput(question) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';
    
    const ratingOptions = document.createElement('div');
    ratingOptions.className = 'rating-options';
    
    const scale = question.scale || 10;
    
    for (let i = 1; i <= scale; i++) {
        const option = document.createElement('div');
        option.className = 'rating-option';
        option.textContent = i;
        option.dataset.value = i;
        
        // If we have a saved response, mark it as selected
        if (responses[question.id] === i.toString()) {
            option.classList.add('selected');
        }
        
        option.addEventListener('click', (e) => {
            // Remove selected class from all options
            document.querySelectorAll('.rating-option').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            e.target.classList.add('selected');
            
            // Save the response
            responses[question.id] = e.target.dataset.value;
        });
        
        ratingOptions.appendChild(option);
    }
    
    inputWrapper.appendChild(ratingOptions);
    return inputWrapper;
}

// Create a single choice input
function createSingleChoiceInput(question) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';
    
    const choiceOptions = document.createElement('div');
    choiceOptions.className = 'choice-options';
    
    question.choices.forEach((choice, index) => {
        const option = document.createElement('div');
        option.className = 'choice-option';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question-${question.id}`;
        radio.id = `choice-${question.id}-${index}`;
        radio.value = choice;
        
        // If we have a saved response, check it
        if (responses[question.id] === choice) {
            radio.checked = true;
        }
        
        radio.addEventListener('change', (e) => {
            // Save the response
            responses[question.id] = e.target.value;
        });
        
        const label = document.createElement('label');
        label.htmlFor = `choice-${question.id}-${index}`;
        label.textContent = choice;
        
        option.appendChild(radio);
        option.appendChild(label);
        choiceOptions.appendChild(option);
    });
    
    inputWrapper.appendChild(choiceOptions);
    return inputWrapper;
}

// Create a multiple choice input
function createMultipleChoiceInput(question) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';
    
    const choiceOptions = document.createElement('div');
    choiceOptions.className = 'multi-choice-options';
    
    question.choices.forEach((choice, index) => {
        const option = document.createElement('div');
        option.className = 'multi-choice-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = `question-${question.id}`;
        checkbox.id = `choice-${question.id}-${index}`;
        checkbox.value = choice;
        
        // If we have a saved response, check it
        if (responses[question.id] && responses[question.id].includes(choice)) {
            checkbox.checked = true;
        }
        
        checkbox.addEventListener('change', (e) => {
            // Initialize the response array if it doesn't exist
            if (!responses[question.id]) {
                responses[question.id] = [];
            }
            
            // Add or remove the choice based on checked state
            if (e.target.checked) {
                if (!responses[question.id].includes(e.target.value)) {
                    responses[question.id].push(e.target.value);
                }
            } else {
                responses[question.id] = responses[question.id].filter(item => item !== e.target.value);
            }
        });
        
        const label = document.createElement('label');
        label.htmlFor = `choice-${question.id}-${index}`;
        label.textContent = choice;
        
        option.appendChild(checkbox);
        option.appendChild(label);
        choiceOptions.appendChild(option);
    });
    
    inputWrapper.appendChild(choiceOptions);
    return inputWrapper;
}

// Navigate to previous or next question
function navigateQuestion(direction) {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < currentSurvey.questions.length) {
        saveCurrentResponse();
        displayQuestion(newIndex);
    }
}

// Save the current response
function saveCurrentResponse() {
    const question = currentSurvey.questions[currentQuestionIndex];
    if (!question) return;
    
    switch (question.type) {
        case 'open':
        case 'open_text':
            const textarea = document.getElementById(`response-${question.id}`);
            if (textarea && textarea.value.trim()) {
                responses[question.id] = textarea.value.trim();
            }
            break;
        case 'rating':
            // Rating is saved when clicked
            break;
        case 'single_choice':
            const selectedRadio = document.querySelector(`input[name="question-${question.id}"]:checked`);
            if (selectedRadio) {
                responses[question.id] = selectedRadio.value;
            }
            break;
        case 'multiple_choice':
            // Multiple choice responses are saved when checkboxes are clicked
            break;
    }
}

// Handle the next button or submit
function handleNextOrSubmit() {
    saveCurrentResponse();
    
    if (currentQuestionIndex < currentSurvey.questions.length - 1) {
        // Go to next question
        displayQuestion(currentQuestionIndex + 1);
    } else {
        // Submit the survey
        submitSurvey();
    }
}

// Handle dismissing the survey
function handleDismiss() {
    // Capture the dismiss event
    captureDismissEvent();
    
    // Show dismissal message
    showThankYouMessage('Survey Dismissed', 'Thank you for your time.');
}

// Submit the survey responses
function submitSurvey() {
    // Transform responses to PostHog format
    const posthogResponses = {};
    
    Object.keys(responses).forEach(questionId => {
        const responseKey = `$survey_response_${questionId}`;
        posthogResponses[responseKey] = responses[questionId];
    });
    
    // Add survey ID
    posthogResponses.$survey_id = currentSurvey.id;
    
    // In a real app, this would send the data to PostHog
    posthog.capture('survey sent', posthogResponses);
    console.log('Survey submitted:', posthogResponses);
    
    // Show thank you message
    showThankYouMessage('Thank You!', 'Your feedback has been submitted successfully.');
}

// Track that the survey was shown (in a real environment)
function captureShownEvent() {
    if (!surveyShown && currentSurvey) {
        // In a real app: 
        posthog.capture('survey shown', { $survey_id: currentSurvey.id });
        console.log('Survey shown:', currentSurvey.id);
        surveyShown = true;
    }
}

// Track that the survey was dismissed (in a real environment)
function captureDismissEvent() {
    if (currentSurvey) {
        // In a real app:
        posthog.capture('survey dismissed', { $survey_id: currentSurvey.id });
        console.log('Survey dismissed:', currentSurvey.id);
    }
}

// Show thank you message
function showThankYouMessage(title, message) {
    const surveyContainer = document.getElementById('survey-container');
    
    const thankYouContainer = document.createElement('div');
    thankYouContainer.className = 'thank-you-message';
    thankYouContainer.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
    `;
    
    surveyContainer.innerHTML = '';
    surveyContainer.appendChild(thankYouContainer);
} 