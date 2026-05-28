let identifiers = ["#8a9e83","#685fa0","#c07a56", "#3d3d3d", "#edebe4"]
let textColors = ["#000000","#ffffff","#000000","#ffffff", "#000000"]

export class Chat {
    constructor(type,user) {
        this.id = crypto.randomUUID();
        this.type = type;
        this.timeStamp = new Date();
        this.status = "active";
        this.#users = [{user: user, identifier: identifier[0], textColor: textColors[0] }];
        this.#messages = [];
    }

    getUsersNumber(){
        return this.#users.length;
    }

    addMessage(message,user) {
        this.#messages.push({content: message, sender: user});
    }

    addUser(user){
        if(this.type === "individual" && this.#users.length >= 2){
            console.log("Chat individual já tem 2 participantes.");
            return;
        }else if(this.type === "group" && this.#users.length >= 5){

        }
        else if(this.#users.some(u => u.id === user.id)){
            console.log("Utilizador já está no chat.");
            return;
        }
        this.#users.push({user: user, identifier: identifiers[this.#users.length], textColor: textColors[this.#users.length]});
    }
}