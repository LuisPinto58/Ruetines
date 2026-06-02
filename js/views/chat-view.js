import { getChat, createChat, handleSendMessage, handleReportMessage } from "../controller/chat-controller.js";
import { sendWarning, banUser, getUserWarnings, expireChat } from "../controller/adminChat-controller.js";


let flag = 0;
let currentChat = null;
let chats = [];

window.onload = async function () {
    await loadChatList();
};

const loadChatList = async () => {
    chats = await getChat();
    console.log(chats)
    renderChatList();
};

const renderChatList = () => {
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

function renderChatElement(chat) {

    const chatSelector = document.getElementById("chat-selector");
    const chatElement = document.createElement("div");
    chatElement.classList.add("chat-container", `${chat.type}-chat`);
    chatElement.style.opacity = chat.status === "active" ? "1" : "0.5";

    chatElement.innerHTML = `
            <h5>${chat.type === "individual" ? "Chat individual" : chat.type === "group" ? "Chat em Grupo" : "Chat administrativo"}</h5>
            <h6>Participantes: ${chat.users.length} <h6>
            <p>${chat.messages?.[chat.messages.length - 1]?.content ?? ""}</p>
        `;

    chatSelector.appendChild(chatElement);

    chatElement.addEventListener("click", () => {
        if (flag === 0) {
            openChatWindow();
            flag = 1;
        }
        currentChat = chat;
        renderChats(chat);
    });
}

export const bindChatSend = (handler) => {
    const chatInput = document.getElementById("chat-input");
    const chatSendBtn = document.getElementById("chat-send-btn");
    if (!chatInput || !chatSendBtn) return;

    const handleSend = async () => {
        const text = chatInput.value.trim();
        if (!text) return;
        await handler(text);
        chatInput.value = "";
    };

    chatSendBtn.addEventListener("click", handleSend);
    chatInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSend();
        }
    });
};

export async function renderChats(chat) {
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

    if (currentUser?.role === "admin" && chat.type === "admin") {
        const adminButtonDiv = document.createElement("div")
        adminButtonDiv.classList.add("admin-button-div")
        adminButtonDiv.innerHTML = `
    <button id="warn-user-btn" class="btn btn-warning warn-btn">Warn User</button>
    <div>Avisos: ${await getUserWarnings(chat.users[0].id)}</div>
    <button id="expire-chat-btn" class="btn btn-secondary expire-btn">Expire Chat</button>
    <button id="ban-user-btn" class="btn btn-danger ban-btn">Ban User</button>
    `;

        document.querySelector(".admin-header").appendChild(adminButtonDiv);

        const warnBtn = document.getElementById("warn-user-btn");
        const banBtn = document.getElementById("ban-user-btn");
        const expireBtn = document.getElementById("expire-chat-btn");
        const reportedUser = chat.users.find(user => user.id !== currentUser.id) || chat.users[0];

        warnBtn.addEventListener("click", async () => {
            if (!reportedUser?.id) return;
            const result = await sendWarning(reportedUser.id);
            if (result?.ok) {
                alert(`User ${reportedUser.id} warned! Total warnings: ${result.warnings || 0}`);
            } else {
                alert('Falha ao avisar usuário.');
            }
        });

        banBtn.addEventListener("click", async () => {
            if (!reportedUser?.id) return;
            const result = await banUser(reportedUser.id);
            if (result?.ok) {
                alert(`User ${reportedUser.id} banned!`);
            } else {
                alert('Falha ao banir usuário.');
            }
        });

        expireBtn.addEventListener("click", async () => {
            if (!reportedUser?.id) return;
            console.log(chat.id);
            const result = await expireChat(chat.id);
            if (result?.ok) {
                alert(`Chat ${chat.id} expired!`);
            } else {
                alert('Falha ao expirar chat.');
            }
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
            messageBubble.classList.add("chat-bubble", sender?.id === currentUserId ? "mine" : "other");

            if (sender) {
                messageBubble.style.backgroundColor = sender.identifier;
                messageBubble.style.color = sender.textColor;
            }

            if (sender?.id === currentUserId || chat.type === "admin") {
                messageBubble.innerHTML = `
                    <div>${message.content}</div>
                `;
                messagesContainer.appendChild(messageBubble);
            } else {
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
                reportButton.addEventListener('click', async (event) => {
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

    bindChatSend(async (text) => {
        const updatedChat = await handleSendMessage(chat, text);
        await loadChatList();
        currentChat = chats.find(c => c.id === updatedChat.id) || updatedChat;
        renderChats(currentChat);
    });
}

const newChatButton = document.getElementById("newChatButton");
if (newChatButton) {
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

        const createHandler = async (type) => {
            try {
                const newChat = await createChat(type);
                await loadChatList();
                currentChat = chats.find(c => c.id === newChat.id) || newChat;
                if (flag === 0) {
                    openChatWindow();
                    flag = 1;
                }
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

        chatModalElement.addEventListener("hidden.bs.modal", function () {
            chatModal.dispose();
            modalDiv.remove();
        });
    });
}

function openChatWindow() {
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

function closeChatWindow() {
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


