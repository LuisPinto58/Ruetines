dbteste = [
  {
    userid: "user1",
    title: "dbteste 1",
    description: "Description for Task 1",
    status: true,
    schedules: ["19:00", "20:00"],
  },
  {
    userid: "user1",
    title: "dbteste 2",
    description: "Description for Task 2",
    status: false,
    schedules: ["22:00", "22:00"],
  },
];

function toggleTaskStatus(task) {
  task.status = !task.status;
  loadTasks();
}

function loadTasks() {
  const tasks = dbteste || [];
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
                    <div> → ${task.schedules[0]}</div>
                </div>
                <p class="mb-0">${task.description}</p>     
            </div>
        `;

    taskElement.addEventListener("click", () => {
      console.log("Card clicado:", task);
    });

    const toggleElement = taskElement.querySelector(".task-toggle");
    // mudar no json server para mudar o status da tarefa
    toggleElement.addEventListener("click", (event) => {
      event.stopPropagation(); 
      toggleTaskStatus(task);
    });

    tasksContainer.appendChild(taskElement);
  });
}

loadTasks();