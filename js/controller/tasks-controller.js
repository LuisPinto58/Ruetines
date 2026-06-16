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

export async function getPremadeTasks() {
    try {
        const response = await fetch("http://localhost:3000/premadeTasks");
        const tasks = await response.json();
        return Array.isArray(tasks) ? tasks.map(Task.fromObject) : [];
    } catch (error) {
        console.error("Error fetching premade tasks:", error);
        return [];
    }
}

export async function createPremadeTask(task) {
    const taskObj = task instanceof Task ? task : Task.fromObject(task);
    if (!taskObj.id) taskObj.id = crypto.randomUUID();
    taskObj.userid = null;
    taskObj.premadeId = null;
    try {
        const response = await fetch("http://localhost:3000/premadeTasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(taskObj.toJSON()),
        });
        const data = await response.json();
        return Task.fromObject(data);
    } catch (error) {
        console.error("Error creating premade task:", error);
    }
}

export async function updatePremadeTask(task) {
    const taskObj = task instanceof Task ? task : Task.fromObject(task);
    try {
        const response = await fetch(`http://localhost:3000/premadeTasks/${taskObj.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(taskObj.toJSON()),
        });
        const updatedTemplate = await response.json();

        // Propagation: get all tasks and update matching user tasks
        const tasksResponse = await fetch("http://localhost:3000/tasks");
        const allTasks = await tasksResponse.json();
        
        for (const t of allTasks) {
            if (t.premadeId === taskObj.id) {
                // Keep user-specific fields, update template fields
                const updatedUserTask = {
                    ...t,
                    title: taskObj.title,
                    description: taskObj.description,
                    schedules: taskObj.schedules
                };
                
                // Keep other template properties if they exist
                for (const key of Object.keys(taskObj)) {
                    if (!['id', 'premadeId', 'userid', 'userId', 'timeStamp', 'status', 'completedHistory', 'isAdmin'].includes(key)) {
                        updatedUserTask[key] = taskObj[key];
                    }
                }

                await fetch(`http://localhost:3000/tasks/${t.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedUserTask),
                });
            }
        }
        return Task.fromObject(updatedTemplate);
    } catch (error) {
        console.error("Error updating premade task:", error);
    }
}

export async function deletePremadeTask(task) {
    const id = task?.id ?? task;
    try {
        await fetch(`http://localhost:3000/premadeTasks/${id}`, {
            method: "DELETE",
        });
        
        // Nullify premadeId of user tasks that referenced this template
        const tasksResponse = await fetch("http://localhost:3000/tasks");
        const allTasks = await tasksResponse.json();
        for (const t of allTasks) {
            if (t.premadeId === id) {
                const updatedUserTask = {
                    ...t,
                    premadeId: null
                };
                await fetch(`http://localhost:3000/tasks/${t.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedUserTask),
                });
            }
        }
        return { success: true };
    } catch (error) {
        console.error("Error deleting premade task:", error);
        return { success: false };
    }
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

    const isAdmin = currentUser.role === "admin";
    const isGuest = currentUser.role === "guest";

    if (isAdmin || isGuest) {
        return getPremadeTasks();
    }

    try {
        const response = await fetch("http://localhost:3000/tasks");
        const tasks = await response.json();
        const mapped = Array.isArray(tasks) ? tasks.map(Task.fromObject) : [];
        return mapped.filter(t => _matchesUser(t.userid, currentUser.id));
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
}

export async function createTasks(task) {
    const currentUser = _getCurrentUser();
    const taskObj = task instanceof Task ? task : Task.fromObject(task);

    if (!currentUser?.id) {
        const guestJson = localStorage.getItem("guestTasks");
        const list = guestJson ? (JSON.parse(guestJson) || []) : [];
        if (!taskObj.id) taskObj.id = crypto.randomUUID();
        taskObj.userid = null;
        taskObj.isAdmin = false;
        list.push(taskObj.toJSON());
        localStorage.setItem("guestTasks", JSON.stringify(list));
        return taskObj;
    }

    const isAdmin = currentUser.role === "admin";
    const isGuest = currentUser.role === "guest";

    if (isAdmin || isGuest) {
        return createPremadeTask(taskObj);
    }

    const validation = Task.validate(task);
    if (!validation.valid) return { success: false, message: validation.message };

    taskObj.userid = currentUser.id;
    taskObj.isAdmin = false;
    
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
        const guestJson = localStorage.getItem("guestTasks");
        const list = guestJson ? (JSON.parse(guestJson) || []) : [];
        const idx = list.findIndex(t => String(t.id) === String(taskObj.id));
        if (idx === -1) return { success: false, message: "Tarefa não encontrada (guest)." };
        list[idx] = taskObj.toJSON();
        localStorage.setItem("guestTasks", JSON.stringify(list));
        return taskObj;
    }

    const isAdmin = currentUser.role === "admin";
    const isGuest = currentUser.role === "guest";

    if (isAdmin || isGuest) {
        return updatePremadeTask(taskObj);
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

    const isAdmin = currentUser.role === "admin";
    const isGuest = currentUser.role === "guest";

    if (isAdmin || isGuest) {
        return deletePremadeTask(id);
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