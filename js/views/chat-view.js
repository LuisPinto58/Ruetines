import { getChat, createChat, sendMessage, handleReportMessage, joinChatRoom, initializeChatSocket } from "../controller/chat-controller.js";
import { sendWarning, banUser, getUserWarnings, expireChat } from "../controller/adminChat-controller.js";

let flag = 0; //flag to control chat window state
let currentChat = null;
let chats = [];

window.onload = async function () { //initializing socket and chat list
    initializeChatSocket(async (payload) => {
        await loadChatList();
        if (currentChat?.id === payload.chatId) {
            currentChat = chats.find(c => c.id === currentChat.id) || currentChat;
            renderChats(currentChat);
        }
    });

    await loadChatList();
};

const loadChatList = async () => { //setting up chat list
    const previousChatId = currentChat?.id;
    chats = await getChat();
    renderChatList();
    if (previousChatId) { //if a chat was open before the refresh, try to keep it open
        currentChat = chats.find(c => c.id === previousChatId) || currentChat;
    }
};

const renderChatList = () => { //rendering chat list with active and expired chats
    const chatSelector = document.getElementById("chat-selector");
    if (!chatSelector) return;

    chatSelector.innerHTML = "";
    let inactiveChat = [];

    chats.forEach(chat => {
        if (chat.status !== "active") {
            inactiveChat.push(chat);
            return;
        };

        renderChatElement(chat);
    });

    const chatDivider = document.createElement("hr");
    chatDivider.textContent = "Chats expirados";
    chatSelector.appendChild(chatDivider);

    inactiveChat.forEach(chat => {
        renderChatElement(chat);
    });

};

function renderChatElement(chat) { //rendering each chat selector card

    const chatSelector = document.getElementById("chat-selector");
    const chatElement = document.createElement("div");
    chatElement.classList.add("chat-container", `${chat.type}-chat`);
    chatElement.style.opacity = chat.status === "active" ? "1" : "0.5"; //dim expired chats

    if (currentChat?.id === chat.id) { //highlighting the currently open chat
        chatElement.classList.add('active-chat');
    }

    chatElement.innerHTML = `
            <h5>${chat.type === "individual" ? "Chat individual" : chat.type === "group" ? "Chat em Grupo" : "Chat administrativo"}</h5>
            <h6>Participantes: ${chat.users.length} <h6>
            <p>${chat.messages?.[chat.messages.length - 1]?.content ?? ""}</p>
        `;

    chatSelector.appendChild(chatElement);

    if (currentChat?.id === chat.id) { //scroll to the currently open chat
        requestAnimationFrame(() => {
            chatElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    chatElement.addEventListener("click", () => { //open chat window and render messages, flag checks if the chat window is already open to avoid unnecessary re-rendering
        if (flag === 0) {
            openChatWindow();
            flag = 1;
        }
        currentChat = chat;
        joinChatRoom(chat.id);
        renderChats(chat);
    });
}

const bindChatSend = async (handler) => { //binding send button and preparing it for controller handling
    const chatInput = document.getElementById("chat-input");
    const chatSendBtn = document.getElementById("chat-send-btn");
    if (!chatInput || !chatSendBtn) return;

    const handleSend = async () => { //controller handling
        const text = chatInput.value.trim();
        if (!text) return;
        await handler(text);
        chatInput.value = "";
    };
    //binding enter and send button
    chatSendBtn.addEventListener("click", handleSend); 
    chatInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSend();
        }
    });
};

export async function renderChats(chat) { //rendering chat window with messages and admin controls if applicable
    const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
    const chatWindow = document.getElementById("chat-window");
    const chatSelector = document.getElementById("chat-selector");
    chatSelector.classList.add("mobile-hidden");
    if (chatSelector.style.display === "none") {
        chatSelector.classList.remove("col-4");
        chatSelector.classList.add("col-12");
        chatWindow.classList.remove("col-7");
        chatWindow.classList.add("col-12");
    }
    if (!chatWindow) return;


    chatWindow.innerHTML = `
        <div class="chat-header">
            <h4>${chat.type === "individual" ? "Chat individual" : chat.type === "group" ? "Chat em Grupo" : "Chat administrativo"}</h4>
            <h6>Participantes: ${chat.users.length} <h6>
            <h6>${chat.status === "active" ? `Hora de fecho: ${new Date(chat.timeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}</h6>
            <button id="close-chat-btn" class="btn-close" aria-label="Fechar chat"></button>
        </div>
        <div class="admin-header"></div>
        <div class="chat-messages" id="chat-messages"></div>
        ${chat.status === "active" ? `
            <div class="chat-input-row">
                <input id="chat-input" type="text" placeholder="Escreva a sua mensagem" />
                <button id="chat-send-btn" class="btn btn-primary chat-send-btn" type="button" aria-label="Enviar mensagem">&#10148;</button>
            </div>
        ` : ""}
    `;

    const currentUser = JSON.parse(localStorage.getItem("user"));

    if (currentUser?.role === "admin" && chat.type === "admin") { //admin controls for admin chats
        const adminButtonDiv = document.createElement("div")
        adminButtonDiv.classList.add("admin-button-div")
        adminButtonDiv.innerHTML = `
    <button id="warn-user-btn" class="btn btn-warning warn-btn">Warn User</button>
    <div id="warning-count">Avisos: ${await getUserWarnings(chat.users[0].id)}</div>
    <button id="expire-chat-btn" class="btn btn-secondary expire-btn">Expire Chat</button>
    <button id="ban-user-btn" class="btn btn-danger ban-btn">Ban User</button>
    `;

        document.querySelector(".admin-header").appendChild(adminButtonDiv);

        const warnBtn = document.getElementById("warn-user-btn");
        const banBtn = document.getElementById("ban-user-btn");
        const expireBtn = document.getElementById("expire-chat-btn");
        const reportedUser = chat.users.find(user => user.id !== currentUser.id) || chat.users[0];

        warnBtn.addEventListener("click", async () => { //give warning to the reported user and update the warning count
            if (!reportedUser?.id) return;
            const result = await sendWarning(reportedUser.id);
            if(result) {
                document.getElementById("warning-count").textContent = `Avisos: ${result || 0}`;
            }
        });

        banBtn.addEventListener("click", async () => { //ban user
            if (!reportedUser?.id) return;
            await banUser(reportedUser.id);
        });

        expireBtn.addEventListener("click", async () => { //expire chat manually as admin chats stay up until admin intervention
            if (!reportedUser?.id) return;
            await expireChat(chat.id);
        });
    }

    chatWindow.querySelector("#close-chat-btn")?.addEventListener("click", () => {
        closeChatWindow();
    });

    const messagesContainer = chatWindow.querySelector("#chat-messages");
    if (!messagesContainer) return;

    if (!chat.messages || chat.messages.length === 0) {
        messagesContainer.innerHTML = `<div class="chat-empty">Sem mensagens neste chat.</div>`;
    } else {
        messagesContainer.innerHTML = "";
        chat.messages.forEach(message => {
            const sender = chat.users?.find(userObj => userObj.id === message.sender);
            const messageBubble = document.createElement("div");
            messageBubble.classList.add("chat-bubble", sender?.id === currentUserId ? "mine" : "other"); //positioning and styling based on sender

            if (sender) {
                messageBubble.style.backgroundColor = sender.identifier;
                messageBubble.style.color = sender.textColor;
            }

            if (sender?.id === currentUserId || chat.type === "admin") {
                messageBubble.innerHTML = `
                    <div>${message.content}</div>
                `;
                messagesContainer.appendChild(messageBubble);
            } else { //report button for other user messages
                messageBubble.innerHTML = `
                    <div class="report-button" style="display:none">⚠</div>
                    <div>${message.content}</div>
                `;

                messagesContainer.appendChild(messageBubble);

                const reportButton = messageBubble.querySelector('.report-button');
                messageBubble.addEventListener('mouseenter', () => {
                    reportButton.style.display = 'flex';
                });
                messageBubble.addEventListener('mouseleave', () => {
                    reportButton.style.display = 'none';
                });
                messageBubble.addEventListener("mousedown", (event) => { //show report button on long press since mobile cant hover
                    setTimeout(function () {
                        if (messageBubble.onmousedown = true)
                            if (reportButton.style.display === 'flex') {
                                reportButton.style.display = 'none';
                            }else{
                                reportButton.style.display === 'flex'
                            }
                    }, 5000)
                })
                reportButton.addEventListener('click', async (event) => { //report listener
                    event.stopPropagation();
                    try {
                        const result = await handleReportMessage(message, chat);
                        if (result?.ok) {
                            alert(`Mensagem reportada: "${message.content}" do chat ${chat.id}`);
                        } else {
                            alert('Falha ao reportar mensagem.');
                        }
                    } catch (error) {
                        console.error('[Chat View] Erro ao reportar mensagem:', error);
                        alert('Erro ao reportar mensagem.');
                    }
                });
            }


        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    bindChatSend(async (text) => { //binding send button to controller and refreshing chat list after sending message
        const updatedChat = await sendMessage(chat, text);
        await loadChatList();
        currentChat = chats.find(c => c.id === updatedChat.id) || updatedChat;
        renderChats(currentChat);
    });
}

const newChatButton = document.getElementById("newChatButton");
if (newChatButton) { //chat creating listener and modal creation
    newChatButton.addEventListener("click", function () {
        const modalDiv = document.createElement("div");
        modalDiv.innerHTML = `
        <div class="modal fade" id="chatModal" tabindex="-1" aria-labelledby="chatModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="chatModalLabel">Novo Chat</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <h5 class="modal-title">Que tipo de chat quer criar?</h5>
                        <div class="button-flex-container">
                            <button class="btn btn-primary btn-highlight" id="individualChatButton">Chat individual</button>
                            <button class="btn btn-success" id="groupChatButton">Chat de grupo</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        document.body.appendChild(modalDiv);
        const chatModalElement = document.getElementById("chatModal");
        const chatModal = new bootstrap.Modal(chatModalElement);
        chatModal.show();

        const createHandler = async (type) => { //handler for chat creation based on type
            try {
                const newChat = await createChat(type);
                await loadChatList();
                currentChat = chats.find(c => c.id === newChat.id) || newChat;
                if (flag === 0) {
                    openChatWindow();
                    flag = 1;
                }
                joinChatRoom(currentChat.id);
                renderChats(currentChat);
            } catch (error) {
                console.error(error);
            } finally {
                chatModal.hide();
            }
        };

        const individualChatButton = modalDiv.querySelector("#individualChatButton");
        const groupChatButton = modalDiv.querySelector("#groupChatButton");

        individualChatButton?.addEventListener("click", () => createHandler("individual"));
        groupChatButton?.addEventListener("click", () => createHandler("group"));
        // Clean up modal after it's hidden
        chatModalElement.addEventListener("hidden.bs.modal", function () {
            chatModal.dispose();
            modalDiv.remove();
        });
    });
}

function openChatWindow() { //open chat window and adjust layout for mobile and desktop
    const chatWindow = document.getElementById("chat-window");
    const chatSelector = document.getElementById("chat-selector");

    if (!chatWindow || !chatSelector) return;

    chatSelector.classList.remove("col-12");
    chatSelector.classList.remove("col-lg-12");
    chatSelector.classList.add("col-lg-4");

    chatWindow.classList.remove("col-0");
    chatWindow.classList.add("col-12");
    chatWindow.classList.add("col-lg-7");

    chatWindow.style.display = "flex";

    requestAnimationFrame(() => {
        chatWindow.classList.add("visible");
    });
}

function closeChatWindow() { //close chat window and adjust layout for mobile and desktop
    const chatWindow = document.getElementById("chat-window");
    const chatSelector = document.getElementById("chat-selector");

    if (!chatWindow || !chatSelector) return;
    if (chatSelector.style.display === "none") {
        chatSelector.classList.add("col-12");
        chatSelector.classList.remove("col-lg-4");

        chatWindow.classList.add("col-12");
        chatWindow.classList.remove("col-lg-7");

    } else {
        chatSelector.classList.add("col-12");
        chatSelector.classList.remove("col-lg-4");

        chatWindow.classList.add("col-12");
        chatWindow.classList.remove("col-lg-7");

    }

    chatWindow.classList.remove("visible");
    chatSelector.classList.remove("mobile-hidden");

    flag = 0;
}


