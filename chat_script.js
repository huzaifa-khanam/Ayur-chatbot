const chatInput = document.querySelector('#chat-input');
const sendButton = document.querySelector('#send-btn');
const chatContainer = document.querySelector('.chat-container');
const themeButton = document.querySelector('#theme-btn');
const deleteButton = document.querySelector('#delete-btn');

let userText = null;
let jsonData = {};
let currentQuestionIndex = 0;
let userResponses = [];
let conversationEnded = false;

const API_KEY = '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'; 

const loadDataFromLocalstorage = () => {
  const themeColor = localStorage.getItem('themeColor');

  document.body.classList.toggle('light-mode', themeColor === 'light_mode');
  themeButton.innerText = document.body.classList.contains('light-mode')
    ? 'dark_mode'
    : 'light_mode';

  const defaultText = `<div class="default-text">
                            <h1>AYUR</h1>
                            <p>Start a conversation.<br> Your chat history will be displayed here <br> Say hi/hello to begin.</p>
                        </div>`;

  chatContainer.innerHTML = localStorage.getItem('all-chats') || defaultText;
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

const createChatElement = (content, className) => {
  const chatDiv = document.createElement('div');
  chatDiv.classList.add('chat', className);
  chatDiv.innerHTML = content;
  return chatDiv;
};

const loadJsonData = async () => {
  try {
    const response = await fetch('data.json');
    jsonData = await response.json();
    loadDataFromLocalstorage();
  } catch (error) {
    console.error('Error loading JSON data:', error);
  }
};

loadJsonData();

const showIntroAndQuestions = () => {
  chatContainer.innerHTML = ''; // Clear chat history

  const introMessage = jsonData.intro.message;
  const introHtml = `<div class="chat-content">
                      <div class="chat-details">
                        <p>${introMessage}</p>
                      </div>
                    </div>`;
  
  const introChatDiv = createChatElement(introHtml, 'incoming');
  chatContainer.appendChild(introChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
  setTimeout(showNextQuestion, 1000);
};

const showNextQuestion = () => {
  if (currentQuestionIndex < jsonData.questions.length) {
    const question = jsonData.questions[currentQuestionIndex];
    const questionHtml = `<div class="chat-content">
                           <div class="chat-details">
                             <p>${question.question}</p>
                             <div class="options">${question.options.map(option => `<button class="option-btn">${option}</button>`).join('')}</div>
                           </div>
                         </div>`;
    
    const questionChatDiv = createChatElement(questionHtml, 'incoming');
    chatContainer.appendChild(questionChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', handleOptionClick);
    });
  } else {
    showFinalResult();
  }
};

const handleOptionClick = (e) => {
  const selectedOption = e.target.textContent;
  const selectedCategory = jsonData.questions[currentQuestionIndex].category;
  const dosha = jsonData.categories[selectedCategory][selectedOption.toLowerCase()];

  userResponses.push({ dosha, selectedOption });

  const selectedOptionHtml = `<div class="chat-content">
                               <div class="chat-details selected-option">
                                 <p>${selectedOption}</p>
                               </div>
                             </div>`;
  
  const selectedOptionChatDiv = createChatElement(selectedOptionHtml, 'incoming');
  chatContainer.appendChild(selectedOptionChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);

  currentQuestionIndex++;
  showNextQuestion();
};

const calculateDominantDosha = () => {
  const doshaCount = { vata: 0, pitta: 0, kapha: 0 };
  userResponses.forEach(response => {
    if (response.dosha) {
      doshaCount[response.dosha]++;
    }
  });

  let dominantDosha = 'vata'; 
  let maxCount = doshaCount['vata'];

  for (const dosha in doshaCount) {
    if (doshaCount[dosha] > maxCount) {
      dominantDosha = dosha;
      maxCount = doshaCount[dosha];
    }
  }

  return dominantDosha;
};

const showFinalResult = () => {
  const dominantDosha = calculateDominantDosha();
  const finalMessage = jsonData.final_result.message.replace('[dominant_dosha]', `<span class="highlight-dosha" style = "color:red ; font-weight:bold;">${dominantDosha}</span>`);

  const finalResultHtml = `<div class="chat-content final-result">
                            <div class="chat-details">
                              <p>${finalMessage}</p>
                            </div>
                          </div>`;
  
  const finalResultChatDiv = createChatElement(finalResultHtml, 'incoming');
  chatContainer.appendChild(finalResultChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);

  conversationEnded = true;
};

const fetchOpenAIResponse = async (userMessage) => {
  const url = 'https://api.openai.com/v1/chat/completions'; 
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };
  
  const body = JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: userMessage }],
    max_tokens: 150
  });
  
  try {
    const response = await fetch(url, { method: 'POST', headers, body });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Unexpected response structure from OpenAI API');
    }
    
  } catch (error) {
    console.error('Error fetching response from OpenAI API:', error);
    return 'Sorry, there was an error processing your request.';
  }
};

const handleOutgoingChat = async () => {
  userText = chatInput.value.trim();
  if (!userText) return;

  chatInput.value = '';
  chatInput.style.height = `${initialInputHeight}px`;

  const html = `<div class="chat-content">
                  <div class="chat-details">
                      <p>${userText}</p>
                  </div>
              </div>`;

  const outgoingChatDiv = createChatElement(html, 'outgoing');
  chatContainer.querySelector('.default-text')?.remove();
  chatContainer.appendChild(outgoingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);

  if (conversationEnded) {
    const aiResponse = await fetchOpenAIResponse(userText);
    const aiResponseHtml = `<div class="chat-content">
                              <div class="chat-details">
                                  <p>${aiResponse}</p>
                              </div>
                            </div>`;
    
    const incomingChatDiv = createChatElement(aiResponseHtml, 'incoming');
    chatContainer.appendChild(incomingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  } else {
    setTimeout(showIntroAndQuestions, 500);
  }
};

themeButton.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('themeColor', themeButton.innerText);
  themeButton.innerText = document.body.classList.contains('light-mode')
    ? 'dark_mode'
    : 'light_mode';
});

deleteButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all the chats?')) {
    localStorage.removeItem('all-chats');
    localStorage.removeItem('themeColor');
    chatContainer.innerHTML = ''; // Clear chat history
    userResponses = []; // Clear user responses
    currentQuestionIndex = 0; // Reset question index
    conversationEnded = false; // Reset conversation state
    showIntroAndQuestions(); // Restart conversation
  }
});

const initialInputHeight = chatInput.scrollHeight;

chatInput.addEventListener('input', () => {
  chatInput.style.height = `${initialInputHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleOutgoingChat();
  }
});

sendButton.addEventListener('click', handleOutgoingChat);

// Reload chat
