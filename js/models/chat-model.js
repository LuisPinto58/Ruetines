let identifiers = ["#8a9e83","#685fa0","#c07a56", "#3d3d3d", "#edebe4"]
let textColors = ["#ffffff","#ffffff","#000000","#ffffff", "#000000"]

export default class Chat {
    #users = [];
    #messages = [];

    get users() {
        return this.#users;
    }

    get messages() {
        return this.#messages;
    }

    constructor(type) {
        this.id = crypto.randomUUID();
        this.type = type;
        this.timeStamp = new Date();
        this.status = "active";
        this.#users = [];
        this.#messages = [];
    }

    getUsersNumber(){
        return this.#users.length;
    }

    addMessage(message, sender) {
        this.#messages.push({ content: message, sender });
    }

    addUser(user) {
        const userId = typeof user === "object" ? user.id : user;

        if (this.type === "individual" && this.#users.length >= 2) {
            console.log("Chat individual já tem 2 participantes.");
            return;
        } else if (this.type === "group" && this.#users.length >= 5) {
            console.log("Chat de grupo já tem 5 participantes.");
            return;
        } else if (this.#users.some(u => u.id === userId)) {
            console.log("Utilizador já está no chat.");
            return;
        }

        this.#users.push({
            id: userId,
            identifier: identifiers[this.#users.length],
            textColor: textColors[this.#users.length],
        });
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            timeStamp: this.timeStamp,
            status: this.status,
            users: this.#users,
            messages: this.#messages,
        };
    }

    static fromObject(obj) {
        const chat = new Chat(obj.type);
        chat.id = obj.id;
        chat.timeStamp = new Date(obj.timeStamp);
        chat.status = obj.status;
        chat.#users = obj.users || [];
        chat.#messages = obj.messages || [];
        return chat;
    }
}