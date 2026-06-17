export default class Task {
    #title;
    #description;
    #completedHistory;
    #schedules;
    #userid;

    constructor(title, description = "") {
        this.id = crypto.randomUUID();
        this.premadeId = null;
        this.timeStamp = new Date();
        this.status = "active";
        this.#title = title?.toString?.() ?? "";
        this.#description = description?.toString?.() ?? "";
        this.#completedHistory = [];
        this.#schedules = [];
        this.#userid = null;
        this.priority = 1;
    }

    /** @returns {string} data atual no formato YYYY-MM-DD */
    static #getToday() {
        return new Date().toISOString().split("T")[0];
    }

    get title() {
        return this.#title;
    }

    set title(v) {
        this.#title = v?.toString?.() ?? "";
    }

    get description() {
        return this.#description;
    }

    set description(v) {
        this.#description = v?.toString?.() ?? "";
    }

    /**
     * A tarefa é considerada "completed" se a data de hoje
     * constar no histórico de conclusões.
     */
    get completed() {
        return this.#completedHistory.includes(Task.#getToday());
    }

    set completed(v) {
        const today = Task.#getToday();
        if (v) {
            if (!this.#completedHistory.includes(today)) {
                this.#completedHistory.push(today);
            }
        } else {
            this.#completedHistory = this.#completedHistory.filter(d => d !== today);
        }
    }

    /** Toggle no estado de conclusão de hoje. 
     *
     * Alterna o estado de hoje no histórico.
     * Se hoje estiver no histórico -> remove (perde a experiência).
     * Se não estiver -> adiciona (ganha experiência).
     */
    toggle() {
        const today = Task.#getToday();
        const idx = this.#completedHistory.indexOf(today);
        if (idx !== -1) {
            this.#completedHistory.splice(idx, 1);
        } else {
            this.#completedHistory.push(today);
        }
    }

    /**
     * Experiência baseada no número total de dias concluídos.
     * Cada dia completo = 50 XP, máximo 300.
     */
    get experience() {
        return Math.min(this.#completedHistory.length * 25, 300);
    }

    /**
     * Retorna o tier com base na experiência:
     *   0-100   -> bronze
     *   100-200 -> prata
     *   200-300 -> ouro
     */
    get tier() {
        if (this.experience >= 200) return "ouro";
        if (this.experience >= 100) return "prata";
        return "bronze";
    }

    get completedHistory() {
        return [...this.#completedHistory];
    }

    set completedHistory(v) {
        this.#completedHistory = Array.isArray(v) ? v.filter(d => typeof d === "string") : [];
    }

    toJSON() {
        const json = {
            id: this.id,
            title: this.title,
            description: this.description,
            priority: this.priority,
            userid: this.userid,
            schedules: this.schedules,
            timeStamp: this.timeStamp?.toISOString?.() ?? this.timeStamp,
            status: this.status,
            completedHistory: this.#completedHistory,
        };
        if (this.premadeId !== undefined && this.premadeId !== null) {
            json.premadeId = this.premadeId;
        }
        return json;
    }

    static fromObject(obj) {
        const task = new Task(obj.title ?? "", obj.description ?? "");
        task.id = obj.id ?? task.id;
        task.premadeId = obj.premadeId ?? null;
        task.timeStamp = obj.timeStamp ? new Date(obj.timeStamp) : task.timeStamp;
        task.status = obj.status ?? task.status;
        task.schedules = Array.isArray(obj.schedules) ? obj.schedules.slice() : (obj.schedules ? [obj.schedules] : []);
        task.userid = obj.userid ?? obj.userId ?? null;
        task.completedHistory = obj.completedHistory ?? [];
        task.priority = obj.priority ?? 1;
        return task;
    }

    static validate(obj) {
        if (!obj) return { valid: false, message: "Tarefa inválida." };
        const title = obj.title ?? obj?.title;
        if (!title || String(title).trim() === "") {
            return { valid: false, message: "O título da tarefa é obrigatório." };
        }
        return { valid: true };
    }

    get schedules() {
        return this.#schedules;
    }

    set schedules(v) {
        this.#schedules = Array.isArray(v) ? v : (v ? [v] : []);
    }

    get userid() {
        return this.#userid;
    }

    set userid(v) {
        this.#userid = v;
    }
}