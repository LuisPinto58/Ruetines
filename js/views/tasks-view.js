import {
  getTasks,
  createTasks,
  updateTasks,
  deleteTasks,
  getPremadeTasks,
} from "../controller/tasks-controller.js";
import User from "../models/users-model.js";

let selectedTask = null;
let tarefasApagadasSessao = [];

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

  const currentUser = User.fromStorage();
  const isManagingTemplates = currentUser && (currentUser.role === "admin" || currentUser.role === "guest");

  // Hide retrieve button if managing templates
  const retrieveBtn = document.getElementById("retrieve-tasks-btn");
  if (retrieveBtn) {
    retrieveBtn.style.display = isManagingTemplates ? "none" : "flex";
  }

  tasks.forEach((task) => {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");

    if (task.completed && !isManagingTemplates) {
      taskElement.classList.add("task-completed");
    }

    taskElement.innerHTML = `
      <div class="card mb-3" style="padding: 10px 15px; cursor: pointer;">
        <div class="d-flex justify-content-between align-items-center">
          
          <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width: 0;">
            ${isManagingTemplates ? `
            <div style="font-size: 1.5rem; display: flex; align-items: center; color: var(--Pedra);">
              <ion-icon name="document-text-outline"></ion-icon>
            </div>
            ` : `
            <div class="task-toggle" style="cursor: pointer; user-select: none; font-size: 1.5rem; display: flex; align-items: center;">
              ${task.completed ? '<ion-icon name="checkmark-circle" style="color: var(--Verde-Loureiro);"></ion-icon>' : '<ion-icon name="checkmark-circle-outline"></ion-icon>'}
            </div>
            `}
            <h5 class="text-truncate" style="margin: 0; padding-right: 10px;"> 
              ${task.title}
            </h5>
            ${task.premadeId ? `<ion-icon name="sparkles" style="color: yellow;"></ion-icon>` : ""}
          </div>

          <div class="d-flex align-items-center flex-shrink-0 ms-2" style="color: var(--Gray); font-size: 0.9rem;">
            ${task.schedules && task.schedules[0] ? `<span class="me-2">${task.schedules[0]}</span>` : ""}
            <ion-icon name="chevron-forward-outline" style="font-size: 1.2rem; color: var(--Pedra);"></ion-icon>
          </div>

        </div>
      </div>
    `;

    taskElement.addEventListener("click", () => {
      console.log("Card clicado:", task);
      selectedTask = task;
      showTaskDetails(task);
    });

    if (!isManagingTemplates) {
      const toggleElement = taskElement.querySelector(".task-toggle");
      if (toggleElement) {
        toggleElement.addEventListener("click", (event) => {
          event.stopPropagation();
          toggleTaskStatus(task);
        });
      }
    }

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
    const currentUser = User.fromStorage();
    const isManagingTemplates = currentUser && (currentUser.role === "admin" || currentUser.role === "guest");

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
                ${isManagingTemplates ? `
                <span class="task-badge status-pending" style="background-color: var(--Branco-Eucalipto); color: var(--Verde-Loureiro); border: 1px solid var(--Verde-Loureiro);">
                  Template
                </span>
                ` : `
                <span class="task-badge ${task.completed ? "status-completed" : "status-pending"}">
                  ${task.completed ? "Concluída hoje" : "Pendente"}
                </span>
                `}
              </h3>
            </div>  
            
          </div>
          <div class="d-flex align-items-center gap-2">
            <button id="edit-task-btn" class="invisible-button" title="Editar tarefa">
              <ion-icon name="pencil-outline" style="color: var(--Verde-Loureiro); font-size: 24px;"></ion-icon>
            </button>
            <button id="delete-task-btn" class="invisible-button" title="Apagar tarefa">
              <ion-icon name="trash-outline" style="color: red; font-size: 24px;"></ion-icon>
            </button>
             <button id="close-detail-btn" class="invisible-button" title="Fechar detalhes">
              <ion-icon name="close-outline" style="color: var(Papel-Cru); font-size: 24px;"></ion-icon>
            </button>
          </div>
        </div>
        <div class="task-detail-body">
            <p class="task-desc">${task.description || "Sem descrição."}</p>
          ${isManagingTemplates ? "" : `
          <!-- Experience Progress Bar (dentro do tier) -->
          <div class="task-meta mb-3">
            <div class="meta-item">
              <span class="meta-label"> TIER: ${task.tier.charAt(0).toUpperCase() + task.tier.slice(1)}</span>
              <div class="d-flex align-items-center gap-2" style="margin-top: 5px;">
                <p style="font-size: 1.60rem; color: #888; margin: 0;">${task.tier == "bronze" ? "🥉" : task.tier == "prata" ? "🥈" : "🥇"}</p>
                <div class="exp-bar-container">
                  <div class="exp-bar-fill exp-tier-${task.tier}" style="width: ${task.tier == "ouro" ? 100 : progressPct}%;"></div>
                </div>
                <p style="font-size: 1.60rem; color: #888; margin: 0;">${task.tier == "bronze" ? "🥈" : task.tier == "prata" ? "🥇" : ""}</p>
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
          `}

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
          tarefasApagadasSessao.push({
            title: task.title,
            description: task.description,
            schedules: task.schedules || [],
          });

          await deleteTasks(task);

          if (container) {
            container.classList.remove("active-task");
          }
          detailedTasksContainer.innerHTML = "";
          await loadTasks();
          await loadPremadeTasks();
        }
      });
    }
  }
}

loadTasks();
loadPremadeTasks();

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
            <input type="text" class="form-control" id="task-title" placeholder="Título" value="${titleValue}" style="background-color: var(--Papel-Cru);">
          </div>
          <div class="form-group">
            <label for="task-description">Descrição</label>
            <textarea class="form-control" id="task-description" rows="3" placeholder="Descrição" style="background-color: var(--Papel-Cru);">${descValue}</textarea>
          </div>
          
          <div class="form-group">
            <label for="task-schedule-input">Horários</label>
            <div class="d-flex gap-2 mb-2">
              <input type="time" class="form-control time-input" id="task-schedule-input" placeholder="HH:MM" style="background-color: var(--Papel-Cru);">
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
  closeModalBtn.addEventListener("click", () => modal.remove());

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
  cancelTaskBtn.addEventListener("click", () => modal.remove());

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
    await loadPremadeTasks();
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

// Premade Tasks - Tarefas Sugeridas

async function loadPremadeTasks() {
  const container = document.getElementById("premade-tasks-container");
  if (!container) return;

  const currentUser = User.fromStorage();
  const isManagingTemplates = currentUser && (currentUser.role === "admin" || currentUser.role === "guest");

  if (isManagingTemplates) {
    const parentContainer = container.closest(".container");
    if (parentContainer) {
      parentContainer.style.display = "none";
    }
    return;
  }

  const token = sessionStorage.getItem("token");
  /*if (!token) {
    container.innerHTML = `
      <div class="premade-login-notice d-flex justify-content-center align-items-center gap-2" style="padding: 2rem; color: var(--Gray);">
        <ion-icon name="lock-closed-outline"></ion-icon>
        <p class="m-0">Faz log in para ver as tarefas sugeridas.</p>
      </div>
      `;
    return;
  }*/

  const existingTasks = (await getTasks()) || [];
  const existingPremadeIds = new Set(
    existingTasks.map((t) => t.premadeId).filter(Boolean),
  );

  container.innerHTML = "";

  const dbPremadeTasks = await getPremadeTasks();

  const randomTasks = [...dbPremadeTasks]
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  randomTasks.forEach((premade) => {
    const alreadyAdded = existingPremadeIds.has(premade.id);

    const card = document.createElement("div");
    card.classList.add("premade-task-card");

    card.innerHTML = `
        <div class="premade-task-info">
          <h6>${premade.title}</h6>
          <small>${premade.description}</small>
        </div>
        <button type="button" class="premade-add-btn" title="${alreadyAdded ? "Já está nas tuas tarefas" : "Adicionar às minhas tarefas"}" ${alreadyAdded ? "disabled" : ""}>
        <ion-icon name="${alreadyAdded ? "checkmark-outline" : "add-outline"}"></ion-icon>
        </button>
      `;

    if (!alreadyAdded) {
      const addBtn = card.querySelector(".premade-add-btn");
      addBtn.addEventListener("click", async () => {
        addBtn.disabled = true;
        await createTasks({
          premadeId: premade.id,
          title: premade.title,
          description: premade.description,
          status: false,
          schedules: [],
        });
        await loadTasks();
        await loadPremadeTasks();
      });
    }
    container.appendChild(card);
  });
}

// --- Modal: Catálogo de Todas as Tarefas Sugeridas no Recuperar ---
async function showAllSuggestedTasksModal() {
  const token = sessionStorage.getItem("token");
  if (!token) {
    alert("Faz log in para recuperares tarefas sugeridas");
    return;
  }

  const existingTasks = (await getTasks()) || [];
  const existingPremadeIds = new Set(
    existingTasks.map((t) => t.premadeId).filter(Boolean),
  );

  const modal = document.createElement("div");
  modal.classList.add(
    "modal",
    "d-flex",
    "justify-content-center",
    "align-items-center",
  );

  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.backgroundColor = "rgba(0,0,0,0.4)";
  modal.style.zIndex = "9999";

  const dbPremadeTasks = await getPremadeTasks();

  let listHtml = dbPremadeTasks.map((t, index) => {
    const alreadyAdded = existingPremadeIds.has(t.id);

    return `
    <div class="card mb-2" style="background-color: var(--Papel-Cru); border: 1px solid var(--Verde-Loureiro);">
      <div class="card-body d-flex justify-content-between align-items-center p-2">
        <div style="min-width: 0;">
          <h6 class="m-0 text-truncate">${t.title}</h6>
          <small class="text-muted d-block text-truncate">${t.description}</small>
        </div>
        <button type="button" class="btn btn-sm add-from-catalog-btn ms-2" data-index="${index}" title="${alreadyAdded ? "Já está nas tuas tarefas" : "Adicionar tarefa"}"
          style="border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: none; transition: 0.2s; background-color: ${alreadyAdded ? "var(--Branco-Eucalipto)" : "var(--Verde-Loureiro)"}; color: ${alreadyAdded ? "var(--Verde-Loureiro)" : "white"};" 
          ${alreadyAdded ? "disabled" : ""}>
          <ion-icon name="${alreadyAdded ? "checkmark-outline" : "add-outline"}" style="font-size: 1.2rem;"></ion-icon>
        </button>
      </div>
    </div>
  `;
  }).join("");

  modal.innerHTML = `
    <div class="modal-content" style="max-height: 80vh; width: min(500px, 90%); display: flex; flex-direction: column;">
      <div class="modal-header pb-2 border-bottom d-flex justify-content-between align-items-center">
        <h3 class="m-0" style="font-size: 1.4rem;">Todas as Sugestões</h3>
        <button type="button" class="modal-close" style="position: static; border: none; background: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div class="modal-body mt-3" style="overflow-y: auto;">
        <p class="text-muted small mb-3">Escolhe as tarefas que queres adicionar à tua lista:</p>
        <div>
          ${listHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal
    .querySelector(".modal-close")
    .addEventListener("click", () => modal.remove());

  modal.querySelectorAll(".add-from-catalog-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const button = e.currentTarget;
      const index = parseInt(button.getAttribute("data-index"), 10);
      const taskToAdd = dbPremadeTasks[index];

      button.disabled = true;
      button.style.backgroundColor = "var(--Branco-Eucalipto)";
      button.style.color = "var(--Verde-Loureiro)";
      button.innerHTML =
        '<ion-icon name="checkmark-outline" style="font-size: 1.2rem;"></ion-icon>';

      await createTasks({
        premadeId: taskToAdd.id,
        title: taskToAdd.title,
        description: taskToAdd.description,
        status: false,
        schedules: [],
      });

      await loadTasks();
      await loadPremadeTasks();
    });
  });
}

document
  .getElementById("retrieve-tasks-btn")
  .addEventListener("click", showAllSuggestedTasksModal);
