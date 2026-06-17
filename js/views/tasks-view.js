import {
  getTasks,
  createTasks,
  updateTasks,
  deleteTasks,
  getPremadeTasks,
  setEnergyState,
  getEnergyState,
  energyModalCheck,
  getCompletedUsersCount,
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
  if(energyModalCheck()){
    openEnergyModal();
  }
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
    const energyState = getEnergyState();
    if(task.priority > energyState){ //só renderiza tarefas dentro dos valroes de energia
      return; 
    }

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
          ${!isManagingTemplates && task.premadeId && task.completed ? `<div id="community-count-container" class="task-meta mb-3">
            <div class="meta-item">
              <span class="meta-value" id="community-count-text">A carregar...</span>
            </div>
          </div>` : ""}
        </div>
      </div>
    `;

    // Fetch community completion count for premade tasks
    if (!isManagingTemplates && task.premadeId && task.completed) {
      getCompletedUsersCount(task.premadeId).then(count => {
        const countText = document.getElementById("community-count-text");
        if (countText) {
          const otherUsers = count - 1; // subtract the current user
          if (otherUsers > 0) {
            countText.innerHTML = `<span style="color: var(--Verde-Loureiro); font-weight: 500;">&#10003; Tu e mais ${otherUsers} ${otherUsers === 1 ? "pessoa concluiu" : "pessoas concluíram"} esta tarefa</span>`;
          } else {
            countText.innerHTML = `<span style="color: var(--Verde-Loureiro); font-weight: 500;">&#10003; Concluíste esta tarefa hoje!</span>`;
          }
        }
      });
    }

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
  const priorityValue = task?.priority ?? 1;
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
            <label for="task-priority">Prioridade</label>
            <select class="form-control" id="task-priority" style="background-color: var(--Papel-Cru);">
              <option value="1" ${priorityValue == 1 ? "selected" : ""}>1 - Alta</option>
              <option value="2" ${priorityValue == 2 ? "selected" : ""}>2 - Média</option>
              <option value="3" ${priorityValue == 3 ? "selected" : ""}>3 - Baixa</option>
            </select>
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
    const taskPriority = Number(
      modal.querySelector("#task-priority").value,
    );
    if (!taskTitle) {
      alert("O título da tarefa é obrigatório.");
      return;
    }
    await onSave(taskTitle, taskDescription, schedulesList, taskPriority);
    modal.remove();
    await loadTasks();
    await loadPremadeTasks();
  });

  return modal;
}

function createTaskModal() {
  buildModal(null, async (title, description, schedules, priority) => {
    await createTasks({
      userid: "user1",
      title,
      description,
      status: false,
      schedules,
      priority,
    });
    selectedTask = null;
    const container = document.querySelector(".container");
    if (container) container.classList.remove("active-task");
    document.getElementById("detailed-tasks-container").innerHTML = "";
  });
}

function editTaskModal(task) {
  buildModal(task, async (title, description, schedules, priority) => {
    task.title = title;
    task.description = description;
    task.schedules = schedules;
    task.priority = priority;
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

function openEnergyModal() {
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
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.45)";
  modal.style.zIndex = "9999";

  modal.innerHTML = `
    <div class="energy-card" style="position: relative; width: min(620px, 92vw);">
      <button type="button" class="energy-modal-close invisible-button" title="Fechar" style="position: absolute; top: 16px; right: 16px; font-size: 1.5rem; color: var(--Carvao);">
        &times;
      </button>
      <span class="energy-subtitle">Um momento para ti</span>
      <h2 class="energy-title">Como está a tua energia hoje ?</h2>
      <div class="energy-options">
        <button class="energy-btn burnout" data-estado=1>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="33" viewBox="0 0 60 33" fill="none">
            <g clip-path="url(#clip0_440_2187)">
              <path d="M6.66667 26.4V6.6H20V26.4H6.66667ZM56.6667 8.25C57.5868 8.25 58.3724 8.57227 59.0234 9.2168C59.6745 9.86133 60 10.6391 60 11.55V21.45C60 22.3609 59.6745 23.1387 59.0234 23.7832C58.3724 24.4277 57.5868 24.75 56.6667 24.75V28.875C56.6667 30.0094 56.2587 30.9805 55.4427 31.7883C54.6267 32.5961 53.6458 33 52.5 33H4.16667C3.02083 33 2.03993 32.5961 1.22396 31.7883C0.407986 30.9805 0 30.0094 0 28.875V4.125C0 2.99062 0.407986 2.01953 1.22396 1.21172C2.03993 0.403906 3.02083 0 4.16667 0H52.5C53.6458 0 54.6267 0.403906 55.4427 1.21172C56.2587 2.01953 56.6667 2.99062 56.6667 4.125V8.25ZM56.6667 21.45V11.55H53.3333V4.125C53.3333 3.88438 53.2552 3.68672 53.099 3.53203C52.9427 3.37734 52.7431 3.3 52.5 3.3H4.16667C3.92361 3.3 3.72396 3.37734 3.56771 3.53203C3.41146 3.68672 3.33333 3.88438 3.33333 4.125V28.875C3.33333 29.1156 3.41146 29.3133 3.56771 29.468C3.72396 29.6227 3.92361 29.7 4.16667 29.7H52.5C52.7431 29.7 52.9427 29.6227 53.099 29.468C53.2552 29.3133 53.3333 29.1156 53.3333 28.875V21.45H56.6667Z" fill="#C07A56"/>
            </g>
            <defs>
              <clipPath id="clip0_440_2187">
                <rect width="60" height="33" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          <span>Má</span>
        </button>

        <button class="energy-btn baixa" data-estado=2>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="33" viewBox="0 0 60 33" fill="none">
            <g clip-path="url(#clip0_440_2189)">
              <path d="M6.66667 26.4V6.6H33.3333V16.5V26.4H6.66667ZM56.6667 8.25C57.5868 8.25 58.3724 8.57227 59.0234 9.2168C59.6745 9.86133 60 10.6391 60 11.55V21.45C60 22.3609 59.6745 23.1387 59.0234 23.7832C58.3724 24.4277 57.5868 24.75 56.6667 24.75V28.875C56.6667 30.0094 56.2587 30.9805 55.4427 31.7883C54.6267 32.5961 53.6458 33 52.5 33H4.16667C3.02083 33 2.03993 32.5961 1.22396 31.7883C0.407986 30.9805 0 30.0094 0 28.875V4.125C0 2.99062 0.407986 2.01953 1.22396 1.21172C2.03993 0.403906 3.02083 0 4.16667 0H52.5C53.6458 0 54.6267 0.403906 55.4427 1.21172C56.2587 2.01953 56.6667 2.99062 56.6667 4.125V8.25ZM56.6667 21.45V11.55H53.3333V4.125C53.3333 3.88438 53.2552 3.68672 53.099 3.53203C52.9427 3.37734 52.7431 3.3 52.5 3.3H4.16667C3.92361 3.3 3.72396 3.37734 3.56771 3.53203C3.41146 3.68672 3.33333 3.88438 3.33333 4.125V28.875C3.33333 29.1156 3.41146 29.3133 3.56771 29.468C3.72396 29.6227 3.92361 29.7 4.16667 29.7H52.5C52.7431 29.7 52.9427 29.6227 53.099 29.468C53.2552 29.3133 53.3333 29.1156 53.3333 28.875V21.45H56.6667Z" fill="#8A9E83"/>
            </g>
            <defs>
              <clipPath id="clip0_440_2189">
                <rect width="60" height="33" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          <span>Média</span>
        </button>

        <button class="energy-btn boa" data-estado=3>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="33" viewBox="0 0 60 33" fill="none">
            <g clip-path="url(#clip0_440_2191)">
              <path d="M6.66667 26.4V6.6H50V16.5V26.125L6.66667 26.4ZM56.6667 8.25C57.5868 8.25 58.3724 8.57227 59.0234 9.2168C59.6745 9.86133 60 10.6391 60 11.55V21.45C60 22.3609 59.6745 23.1387 59.0234 23.7832C58.3724 24.4277 57.5868 24.75 56.6667 24.75V28.875C56.6667 30.0094 56.2587 30.9805 55.4427 31.7883C54.6267 32.5961 53.6458 33 52.5 33H4.16667C3.02083 33 2.03993 32.5961 1.22396 31.7883C0.407986 30.9805 0 30.0094 0 28.875V4.125C0 2.99062 0.407986 2.01953 1.22396 1.21172C2.03993 0.403906 3.02083 0 4.16667 0H52.5C53.6458 0 54.6267 0.403906 55.4427 1.21172C56.2587 2.01953 56.6667 2.99062 56.6667 4.125V8.25ZM56.6667 21.45V11.55H53.3333V4.125C53.3333 3.88438 53.2552 3.68672 53.099 3.53203C52.9427 3.37734 52.7431 3.3 52.5 3.3H4.16667C3.92361 3.3 3.72396 3.37734 3.56771 3.53203C3.41146 3.68672 3.33333 3.88438 3.33333 4.125V28.875C3.33333 29.1156 3.41146 29.3133 3.56771 29.468C3.72396 29.6227 3.92361 29.7 4.16667 29.7H52.5C52.7431 29.7 52.9427 29.6227 53.099 29.468C53.2552 29.3133 53.3333 29.1156 53.3333 28.875V21.45H56.6667Z" fill="#6B5FA0"/>
            </g>
            <defs>
              <clipPath id="clip0_440_2191">
                <rect width="60" height="33" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          <span>Boa</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();

  const closeBtn = modal.querySelector(".energy-modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  modal.querySelectorAll(".energy-btn").forEach((button) => {
    button.addEventListener("click", () => {
      setEnergyState(parseInt(button.dataset.estado));
      closeModal();
    });
  });
}

document
  .getElementById("retrieve-tasks-btn")
  .addEventListener("click", showAllSuggestedTasksModal);

