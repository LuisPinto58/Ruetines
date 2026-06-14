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

function _cacheKeyForUser(currentUser) {
    return currentUser?.id ? `offlineTasks:${currentUser.id}` : "guestTasks";
}

function _readCachedTasks(key) {
    try {
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch (error) {
        console.error("Error reading cached tasks:", error);
        return [];
    }
}

function _writeCachedTasks(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
}

function _isOnline() {
    return typeof navigator === "undefined" || navigator.onLine !== false;
}

export async function getTasks() {
    const currentUser = _getCurrentUser();
    const cacheKey = _cacheKeyForUser(currentUser);

    if (!currentUser?.id) {
        return _readCachedTasks(cacheKey).map(Task.fromObject);
    }

    try {
        const response = await fetch("http://localhost:3000/tasks");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const tasks = await response.json();
        const mapped = Array.isArray(tasks) ? tasks.map(Task.fromObject) : [];
        const userTasks = mapped.filter(t => _matchesUser(t.userid, currentUser.id));

        _writeCachedTasks(cacheKey, userTasks.map(t => t.toJSON()));
        return userTasks;
    } catch (error) {
        console.warn("Offline fallback: using cached tasks.", error);
        return _readCachedTasks(cacheKey).map(Task.fromObject);
    }
}


export async function createTasks(task) {
    const validation = Task.validate(task);
    if (!validation.valid) return { success: false, message: validation.message };

    const currentUser = _getCurrentUser();
    const taskObj = task instanceof Task ? task : Task.fromObject(task);
    const cacheKey = _cacheKeyForUser(currentUser);

    if (!currentUser?.id) {
        const list = _readCachedTasks(cacheKey);
        if (!taskObj.id) taskObj.id = crypto.randomUUID();
        taskObj.userid = null;
        taskObj.isAdmin = false;
        list.push(taskObj.toJSON());
        _writeCachedTasks(cacheKey, list);
        return taskObj;
    }

    taskObj.userid = currentUser.id;
    taskObj.isAdmin = currentUser.role === "admin";

    if (!_isOnline()) {
        const list = _readCachedTasks(cacheKey);
        if (!taskObj.id) taskObj.id = crypto.randomUUID();
        list.push(taskObj.toJSON());
        _writeCachedTasks(cacheKey, list);
        return taskObj;
    }

    try {
        const response = await fetch("http://localhost:3000/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(taskObj.toJSON()),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        _writeCachedTasks(cacheKey, [Task.fromObject(data).toJSON()]);
        return Task.fromObject(data);
    } catch (error) {
        console.warn("Offline fallback: saving task locally.", error);
        const list = _readCachedTasks(cacheKey);
        if (!taskObj.id) taskObj.id = crypto.randomUUID();
        list.push(taskObj.toJSON());
        _writeCachedTasks(cacheKey, list);
        return taskObj;
    }
}

export async function updateTasks(task) {
    const currentUser = _getCurrentUser();
    const taskObj = task instanceof Task ? task : Task.fromObject(task);
    const cacheKey = _cacheKeyForUser(currentUser);

    if (!currentUser?.id || !_isOnline()) {
        const list = _readCachedTasks(cacheKey);
        const idx = list.findIndex(t => String(t.id) === String(taskObj.id));
        if (idx === -1) return { success: false, message: "Tarefa não encontrada no armazenamento local." };
        list[idx] = taskObj.toJSON();
        _writeCachedTasks(cacheKey, list);
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

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        return Task.fromObject(data);
    } catch (error) {
        console.warn("Offline fallback: saving update locally.", error);
        const list = _readCachedTasks(cacheKey);
        const idx = list.findIndex(t => String(t.id) === String(taskObj.id));
        if (idx === -1) return { success: false, message: "Tarefa não encontrada no armazenamento local." };
        list[idx] = taskObj.toJSON();
        _writeCachedTasks(cacheKey, list);
        return taskObj;
    }
}

export async function deleteTasks(task) {
    const currentUser = _getCurrentUser();
    const id = task?.id ?? task;
    const cacheKey = _cacheKeyForUser(currentUser);

    if (!id) return { success: false, message: "ID da tarefa é obrigatório para exclusão." };

    if (!currentUser?.id || !_isOnline()) {
        const list = _readCachedTasks(cacheKey);
        const newList = list.filter(t => String(t.id) !== String(id));
        _writeCachedTasks(cacheKey, newList);
        return { success: true };
    }

    try {
        const response = await fetch(`http://localhost:3000/tasks/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json().catch(() => ({}));
        return data;
    } catch (error) {
        console.warn("Offline fallback: deleting task locally.", error);
        const list = _readCachedTasks(cacheKey);
        const newList = list.filter(t => String(t.id) !== String(id));
        _writeCachedTasks(cacheKey, newList);
        return { success: true };
    }
}
