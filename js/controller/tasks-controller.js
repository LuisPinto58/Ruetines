import Task from "../models/tasks-model.js";
import User from "../models/users-model.js";

function _getCurrentUser() {
    return User.fromStorage();
}

function _matchesUser(taskUserid, userId) {
    if (taskUserid == null || userId == null) return false;
    const a = String(taskUserid);
    const b = String(userId);
    return a === b || a === `user${b}` || a.endsWith(b);
}

export async function getTasks() {
    const currentUser = _getCurrentUser();
    if (!currentUser?.id) {
        const guestJson = localStorage.getItem("guestTasks");
        try {
            const list = guestJson ? JSON.parse(guestJson) : [];
            return Array.isArray(list) ? list.map(Task.fromObject) : [];
        } catch (e) {
            console.error("Error parsing guest tasks:", e);
            return [];
        }
    }

    try {
        const response = await fetch("http://localhost:3000/tasks");
        const tasks = await response.json();
        const mapped = Array.isArray(tasks) ? tasks.map(Task.fromObject) : [];
        // mostrar apenas tasks do utilizador
        return mapped.filter(t => _matchesUser(t.userid, currentUser.id));
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
}


export async function createTasks(task) {
    const validation = Task.validate(task);
    if (!validation.valid) return { success: false, message: validation.message };

    const currentUser = _getCurrentUser();
    const taskObj = task instanceof Task ? task : Task.fromObject(task);

    // if not logged, persist in localStorage
    if (!currentUser?.id) {
        const guestJson = localStorage.getItem("guestTasks");
        const list = guestJson ? (JSON.parse(guestJson) || []) : [];
        // ensure id
        if (!taskObj.id) taskObj.id = crypto.randomUUID();
        // clear any userid for guest
        taskObj.userid = null;
        taskObj.isAdmin = false;
        list.push(taskObj.toJSON());
        localStorage.setItem("guestTasks", JSON.stringify(list));
        return taskObj;
    }

    // when logged, attach user id and POST to server
    taskObj.userid = currentUser.id;
    taskObj.isAdmin = currentUser.role === "admin";
    try {
        const response = await fetch("http://localhost:3000/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(taskObj.toJSON()),
        });
        const data = await response.json();
        return Task.fromObject(data);
    } catch (error) {
        console.error("Error creating task:", error);
    }
}

export async function updateTasks(task) {
    const currentUser = _getCurrentUser();
    const taskObj = task instanceof Task ? task : Task.fromObject(task);

    if (!currentUser?.id) {
        // update guest task in localStorage
        const guestJson = localStorage.getItem("guestTasks");
        const list = guestJson ? (JSON.parse(guestJson) || []) : [];
        const idx = list.findIndex(t => String(t.id) === String(taskObj.id));
        if (idx === -1) return { success: false, message: "Tarefa não encontrada (guest)." };
        list[idx] = taskObj.toJSON();
        localStorage.setItem("guestTasks", JSON.stringify(list));
        return taskObj;
    }

    try {
        const response = await fetch(`http://localhost:3000/tasks/${taskObj.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(taskObj.toJSON()),
        });
        const data = await response.json();
        return Task.fromObject(data);
    } catch (error) {
        console.error("Error updating task:", error);
    }
}

export async function deleteTasks(task) {
    const currentUser = _getCurrentUser();
    const id = task?.id ?? task;
    if (!id) return { success: false, message: "ID da tarefa é obrigatório para exclusão." };

    if (!currentUser?.id) {
        const guestJson = localStorage.getItem("guestTasks");
        const list = guestJson ? (JSON.parse(guestJson) || []) : [];
        const newList = list.filter(t => String(t.id) !== String(id));
        localStorage.setItem("guestTasks", JSON.stringify(newList));
        return { success: true };
    }

    try {
        const response = await fetch(`http://localhost:3000/tasks/${id}`, {
            method: "DELETE",
        });
        const data = await response.json().catch(() => ({}));
        return data;
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}
