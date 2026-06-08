import {
  getTasks,
  createTasks,
  updateTasks,
  deleteTasks,
} from "../controller/tasks-controller.js";

let selectedTask = null;

// função para alternar o estado de conclusão da tarefa (modelo cuida do histórico e XP)
async function toggleTaskStatus(task) {
  task.toggle(); // alterna a data de hoje no completedHistory
  await updateTasks(task);
  await loadTasks();
  if (selectedTask && selectedTask.id === task.id) {
    selectedTask = task;
    showTaskDetails(task);
  }
}

/**
 * Retorna a percentagem da barra DENTRO do tier atual.
 *   bronze (0-100)  → exp / 100
 *   prata (100-200) → (exp-100) / 100
 *   ouro  (200-300) → (exp-200) / 100
 */
function expProgress(task) {
  const exp = task.experience;
  if (exp >= 200) return (exp - 200) / 100;
  if (exp >= 100) return (exp - 100) / 100;
  return exp / 100;
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
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2 flex-grow-1">
            <div class="task-toggle" style="cursor: pointer; user-select: none; font-size: 1.5rem; display: flex; align-items: center;">
              ${task.completed ? '<ion-icon name="checkmark-circle"></ion-icon>' : '<ion-icon name="checkmark-circle-outline"></ion-icon>'}
            </div>
            <h5 style="margin: 0; flex-grow: 1;"> 
              ${task.title}
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
  const detailedTasksContainer = document.getElementById(
    "detailed-tasks-container",
  );

  if (container) {
    container.classList.add("active-task");
  }

  if (detailedTasksContainer) {
    const progress = expProgress(task);
    const progressPct = Math.round(progress * 100);

    detailedTasksContainer.innerHTML = `
      <div class="task-detail-card">
        <div class="task-detail-header d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center flex-grow-1 me-2">
            <button id="back-to-list-btn" class="btn btn-sm btn-outline-secondary d-md-none me-2">
              &larr;
            </button>
            <div class="flex-grow-1">
              <h3 class="mb-0 text-wrap" style="word-break: break-word;">
                ${task.title}
                <span class="task-badge ${task.completed ? "status-completed" : "status-pending"}">
                  ${task.completed ? "Concluída hoje" : "Pendente"}
                </span>
              </h3>
            </div>
            
          </div>
          <div class="d-flex align-items-center gap-2">
            <button id="edit-task-btn" class="invisible-button" title="Editar tarefa">
              <ion-icon name="pencil-outline" style="color: #8a9e83; font-size: 22px;"></ion-icon>
            </button>
            <button id="delete-task-btn" class="invisible-button">
              <ion-icon name="trash-outline" style="color: red; font-size: 24px;"></ion-icon>
            </button>
             <button id="close-detail-btn" class="invisible-button" title="Fechar detalhes">
              <ion-icon name="close-outline" style="color: #888; font-size: 24px;"></ion-icon>
            </button>
          </div>
        </div>
        <div class="task-detail-body">
        
          <p class="task-desc">${task.description || "Sem descrição."}</p>

          <!-- Experience Progress Bar (dentro do tier) -->
          <div class="task-meta mb-3">
            <div class="meta-item">
              <span class="meta-label">Experiência — Tier ${task.tier.charAt(0).toUpperCase() + task.tier.slice(1)}</span>
              <div class="d-flex align-items-center gap-2" style="margin-top: 5px;">
                <div class="exp-bar-container">
                  <div class="exp-bar-fill exp-tier-${task.tier}" style="width: ${progressPct}%;"></div>
                </div>
                <p style="font-size: 0.75rem; color: #888; margin: 0;">${task.tier}</p>
              </div>
              <div class="d-flex justify-content-between" style="font-size: 0.75rem; color: #888; margin-top: 2px;">
                
              </div>
            </div>
          </div>

          <!-- Histórico de dias concluídos por isso no accountpage -->
          <div class="task-meta mb-3">
            <div class="meta-item">
              <span class="meta-label">Histórico de Conclusões</span>
              <span class="meta-value">${task.completedHistory.length > 0 ? task.completedHistory.join(", ") : "Nenhum dia concluído"}</span>
            </div>
          </div>

          <div class="task-meta mb-3">
            <div class="meta-item">
              <span class="meta-label">Horários</span>
              <span class="meta-value">${task.schedules && task.schedules.length > 0 ? task.schedules.join(", ") : "Sem horários definidos"}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const closeDetailBtn =
      detailedTasksContainer.querySelector("#close-detail-btn");
    if (closeDetailBtn && container) {
      closeDetailBtn.addEventListener("click", () => {
        container.classList.remove("active-task");
      });
    }

    const backBtn = detailedTasksContainer.querySelector("#back-to-list-btn");
    if (backBtn && container) {
      backBtn.addEventListener("click", () => {
        container.classList.remove("active-task");
      });
    }

    const editBtn = detailedTasksContainer.querySelector("#edit-task-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        editTaskModal(task);
      });
    }

    const deleteBtn = detailedTasksContainer.querySelector("#delete-task-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (
          confirm(`Tem a certeza que deseja eliminar a tarefa "${task.title}"?`)
        ) {
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

/** Cria a estrutura da modal (reutilizável para criar e editar) */
function buildModal(task, onSave) {
  const modal = document.createElement("div");
  modal.classList.add(
    "modal",
    "d-flex",
    "justify-content-center",
    "align-items-center",
  );
  const schedulesList = task ? [...task.schedules] : [];

  const titleValue = task ? task.title : "";
  const descValue = task ? task.description : "";
  const modalTitle = task ? "Editar Tarefa" : "Criar Tarefa";

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${modalTitle}</h3>
        <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
      </div>
      <div class="modal-body">
        <form>
          <div class="form-group">
            <label for="task-title">Título</label>
            <input type="text" class="form-control" id="task-title" placeholder="Título" value="${titleValue}">
          </div>
          <div class="form-group">
            <label for="task-description">Descrição</label>
            <textarea class="form-control" id="task-description" rows="3" placeholder="Descrição">${descValue}</textarea>
          </div>
          <div class="form-group">
            <label for="task-schedule-input">Horários</label>
            <div class="d-flex gap-2 mb-2">
              <input type="time" class="form-control" id="task-schedule-input" placeholder="HH:MM">
              <button type="button" class="btn btn-success" id="add-schedule-btn">Adicionar</button>
            </div>
            <div id="schedules-list" class="d-flex flex-wrap gap-2"></div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-task-btn" data-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="save-task-btn">${task ? "Guardar" : "Salvar"}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const updateSchedulesList = () => {
    const listDiv = modal.querySelector("#schedules-list");
    listDiv.innerHTML = schedulesList
      .map(
        (time) => `
      <span class="badge bg-info d-flex align-items-center gap-2" style="background-color: #a8a89e; color: white;">
        ${time}
        <button type="button" class="btn-close btn-close-white" data-time="${time}" style="cursor: pointer;"></button>
      </span>
    `,
      )
      .join("");

    listDiv.querySelectorAll(".btn-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        schedulesList.splice(schedulesList.indexOf(btn.dataset.time), 1);
        updateSchedulesList();
      });
    });
  };

  // render existing schedules
  updateSchedulesList();

  const closeModalBtn = modal.querySelector(".modal-close");
  closeModalBtn.addEventListener("click", () => {
    modal.remove();
  });

  const addScheduleBtn = modal.querySelector("#add-schedule-btn");
  addScheduleBtn.addEventListener("click", () => {
    const input = modal.querySelector("#task-schedule-input");
    const time = input.value.trim();
    if (time && !schedulesList.includes(time)) {
      schedulesList.push(time);
      schedulesList.sort();
      input.value = "";
      updateSchedulesList();
    }
  });

  const cancelTaskBtn = modal.querySelector("#cancel-task-btn");
  cancelTaskBtn.addEventListener("click", () => {
    modal.remove();
  });

  const saveTaskBtn = modal.querySelector("#save-task-btn");
  saveTaskBtn.addEventListener("click", async () => {
    const taskTitle = modal.querySelector("#task-title").value.trim();
    const taskDescription = modal
      .querySelector("#task-description")
      .value.trim();
    if (!taskTitle) {
      alert("O título da tarefa é obrigatório.");
      return;
    }
    await onSave(taskTitle, taskDescription, schedulesList);
    modal.remove();
    await loadTasks();
  });

  return modal;
}

function createTaskModal() {
  buildModal(null, async (title, description, schedules) => {
    await createTasks({
      userid: "user1",
      title,
      description,
      status: false,
      schedules,
    });
    selectedTask = null;
    const container = document.querySelector(".container");
    if (container) container.classList.remove("active-task");
    document.getElementById("detailed-tasks-container").innerHTML = "";
  });
}

function editTaskModal(task) {
  buildModal(task, async (title, description, schedules) => {
    task.title = title;
    task.description = description;
    task.schedules = schedules;
    await updateTasks(task);
    selectedTask = task;
    showTaskDetails(task);
  });
}

document
  .getElementById("add-task-btn")
  .addEventListener("click", createTaskModal);
document
  .getElementById("retrieve-tasks-btn")
  .addEventListener("click", loadTasks);
