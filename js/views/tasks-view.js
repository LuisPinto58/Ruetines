import { getTasks, createTasks, updateTasks, deleteTasks } from "../controller/tasks-controller.js";

let selectedTask = null;

// função para alternar o status da tarefa (concluída/pendente)
async function toggleTaskStatus(task) {
  task.status = !task.status;
  await updateTasks(task);
  await loadTasks();
  if (selectedTask && selectedTask.id === task.id) {
    selectedTask = task;
    showTaskDetails(task);
  }
}

// função para carregar as tarefas no painel esquerdo
async function loadTasks() {
  const tasks = (await getTasks()) || [];
  const tasksContainer = document.getElementById("tasks-container");

  if (!tasksContainer) return;

  tasksContainer.innerHTML = "";

  tasks.forEach((task) => {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");

    taskElement.innerHTML = `
      <div class="card mb-3" style="padding: 10px 15px; cursor: pointer;">
        <div class="d-flex justify-content-between">
          <div class="d-flex justify-content-start">
            <h5 class="task-toggle" style="cursor: pointer; user-select: none;"> 
              ${task.status ? "[x] " : "[] "}${task.title}
            </h5>
          </div>
          <div> → ${task.schedules && task.schedules[0] ? task.schedules[0] : ""}</div>
        </div>
      </div>
    `;

    taskElement.addEventListener("click", () => {
      console.log("Card clicado:", task);
      selectedTask = task;
      showTaskDetails(task);
    });

    const toggleElement = taskElement.querySelector(".task-toggle");
    // no futuro mudar o status da tarefa
    toggleElement.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleTaskStatus(task);
    });

    tasksContainer.appendChild(taskElement);
  });
}

// Função para mostrar detalhes da tarefa no painel direito
function showTaskDetails(task) {
  const container = document.querySelector(".container");
  const detailedTasksContainer = document.getElementById("detailed-tasks-container");

  if (container) {
    container.classList.add("active-task");
  }

  if (detailedTasksContainer) {
    detailedTasksContainer.innerHTML = `
      <div class="task-detail-card">
        <div class="task-detail-header d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            <button id="back-to-list-btn" class="btn btn-sm btn-outline-secondary d-md-none me-2">&larr;</button>
            <h3>${task.title}</h3>
          </div>
          <span class="task-badge ${task.status ? 'status-completed' : 'status-pending'}">
            ${task.status ? "Concluída" : "Pendente"}
          </span>
        </div>
        <div class="task-detail-body">
          <p class="task-desc">${task.description || "Sem descrição."}</p>
          <div class="task-meta mb-3">
            <div class="meta-item">
              <span class="meta-label">Horários</span>
              <span class="meta-value">${task.schedules && task.schedules.length > 0 ? task.schedules.join(", ") : "Sem horários definidos"}</span>
            </div>
          </div>
          <div class="d-flex flex-column flex-md-row justify-content-md-end gap-2 mt-4">
            <button id="delete-task-btn" class="btn btn-danger btn-sm w-100 w-md-auto">Eliminar tarefa</button>
          </div>
        </div>
      </div>
    `;

    const backBtn = detailedTasksContainer.querySelector("#back-to-list-btn");
    if (backBtn && container) {
      backBtn.addEventListener("click", () => {
        container.classList.remove("active-task");
      });
    }

    const deleteBtn = detailedTasksContainer.querySelector("#delete-task-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (confirm(`Tem a certeza que deseja eliminar a tarefa "${task.title}"?`)) {
          await deleteTasks(task);

          if (container) {
            container.classList.remove("active-task");
          }
          detailedTasksContainer.innerHTML = "";
          await loadTasks();
        }
      });
    }
  }
}

loadTasks();

function createTaskModal() {
  const modal = document.createElement("div");
  modal.classList.add("modal", "d-flex", "justify-content-center", "align-items-center");
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Criar Tarefa</h3>
        <button type="button" class="close" data-dismiss="modal">&times;</button>
      </div>
      <div class="modal-body">
        <form>
          <div class="form-group">
            <label for="task-title">Título</label>
            <input type="text" class="form-control" id="task-title" placeholder="Título">
          </div>
          <div class="form-group">
            <label for="task-description">Descrição</label>
            <textarea class="form-control" id="task-description" rows="3" placeholder="Descrição"></textarea>
          </div>
          <div class="form-group">
            <label for="task-schedules">Horários</label>
            <input type="text" class="form-control" id="task-schedules" placeholder="Horários">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-task-btn" data-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="save-task-btn">Salvar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeModalBtn = modal.querySelector(".close");
  closeModalBtn.addEventListener("click", () => {
    modal.remove();
  });

  const cancelTaskBtn = modal.querySelector("#cancel-task-btn");
  cancelTaskBtn.addEventListener("click", () => {
    modal.remove();
  });

  const saveTaskBtn = modal.querySelector("#save-task-btn");
  saveTaskBtn.addEventListener("click", () => {
    const taskTitle = modal.querySelector("#task-title").value;
    const taskDescription = modal.querySelector("#task-description").value;
    const taskSchedules = modal.querySelector("#task-schedules").value;
    createTasks({
      userid: "user1",
      title: taskTitle,
      description: taskDescription,
      status: true,
      schedules: taskSchedules.split(","),
    });
    modal.remove();
    loadTasks();
  });
}

document.getElementById("add-task-btn").addEventListener("click", createTaskModal);
document.getElementById("retrieve-tasks-btn").addEventListener("click", loadTasks);
