export async function getTasks() {
    try {
        const response = await fetch("http://localhost:3000/tasks");
        const tasks = await response.json();
        return tasks;
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}


export async function createTasks(task) {
    if (!task.title || task.title.trim() === "") {
        return {
            success: false,
            message: "O título da tarefa é obrigatório."
        };
    }
    try {
        const response = await fetch("http://localhost:3000/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(task),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error creating task:", error);
    }
}

export async function updateTasks(task) {
    try {
        const response = await fetch(`http://localhost:3000/tasks/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(task),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error updating task:", error);
    }
}

export async function deleteTasks(task) {
    try {
        const response = await fetch(`http://localhost:3000/tasks/${task.id}`, {
            method: "DELETE",
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}
