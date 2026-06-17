export default class User {
    #id;
    #email;
    #role;
    #warnings;

    constructor(email = '', role = 'user', data = {}) { //no password in frontend for security
        this.#id = data.id ?? null;
        this.#email = email?.toString?.() ?? '';
        this.#role = role?.toString?.() ?? 'user';
        this.#warnings = Number.isFinite(data.warnings) ? data.warnings : 0;
    }

    get id() { return this.#id; }
    set id(v) { this.#id = v ?? null; }

    get email() { return this.#email; }
    set email(v) { this.#email = v?.toString?.() ?? ''; }

    get role() { return this.#role; }
    set role(v) { this.#role = v?.toString?.() ?? 'user'; }

    get warnings() { return this.#warnings; }
    set warnings(v) { this.#warnings = Number.isFinite(Number(v)) ? Number(v) : 0; }

    get isAdmin() { return this.#role === 'admin'; }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            role: this.role,
            warnings: this.warnings,
        };
    }

    static fromObject(obj) {
        if (!obj) return null;

        return new User(obj.email ?? '', obj.role ?? 'user', {
            id: obj.id ?? obj.userId ?? null,
            warnings: obj.warnings ?? 0,
        });
    }

    static fromStorage(key = 'user') {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return User.fromObject(JSON.parse(raw));
        } catch (error) {
            console.error('Erro ao ler utilizador do armazenamento:', error);
            return null;
        }
    }

    static saveToStorage(user, key = 'user') {
        const model = user instanceof User ? user : User.fromObject(user);
        if (!model) return;
        localStorage.setItem(key, JSON.stringify(model.toJSON()));
    }
}
