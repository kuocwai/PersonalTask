
const table =
    document.getElementById("taskTable");

const modal =
    document.getElementById("taskModal");

const editModal =
    document.getElementById("editModal");

let currentEditId = null;

function getStatusBadge(status) {

    if (status === "Done") {

        return `
        <span class="status done">
            Done
        </span>
        `;
    }

    if (status === "In Progress") {

        return `
        <span class="status progress">
            In Progress
        </span>
        `;
    }

    return `
    <span class="status pending">
        Pending
    </span>
    `;
}

function getDeadlineStatus(deadline) {

    const parts =
        deadline.split("/");

    const due =
        new Date(
            parts[2],
            parts[1] - 1,
            parts[0]
        );

    const today =
        new Date();

    today.setHours(
        0, 0, 0, 0
    );

    due.setHours(
        0, 0, 0, 0
    );

    const diff =
        Math.ceil(
            (due - today)
            /
            (1000 * 60 * 60 * 24)
        );

    if (diff < 0) {

        return `
        <span style="color:red">
            Quá hạn
        </span>
        `;
    }

    if (diff <= 3) {

        return `
        <span style="color:#f57c00">
            Còn ${diff} ngày
        </span>
        `;
    }

    return "";
}

async function loadTasks() {

    const response =
        await fetch(
            "/api/tasks"
        );

    const data =
        await response.json();

    table.innerHTML = "";

    updateDashboard(
        data.tasks
    );

    data.tasks.forEach(task => {

        table.innerHTML += `

        <tr>

            <td>${task.taskName}</td>

            <td>${task.description}</td>

            <td>

                ${task.deadline}

                <br>

                ${getDeadlineStatus(
            task.deadline
        )}

            </td>

            <td>

                <div class="task-progress">

                    <div
                        class="task-progress-fill"
                        style="width:${task.progress}%">

                        ${task.progress}%

                    </div>

                </div>

            </td>

            <td>${task.note || ""}</td>

            <td>

                ${getStatusBadge(
            task.status
        )}

            </td>

            <td>

                <button
                    onclick="editTask(${task.id})">

                    Sửa

                </button>

                <button
                    onclick="deleteTask(${task.id})">

                    Xóa

                </button>

            </td>

        </tr>

        `;
    });
}

function updateDashboard(tasks) {

    document
        .getElementById("totalTasks")
        .innerText =
        tasks.length;

    document
        .getElementById("doneTasks")
        .innerText =
        tasks.filter(
            t =>
                t.status === "Done"
        ).length;

    document
        .getElementById("doingTasks")
        .innerText =
        tasks.filter(
            t =>
                t.status ===
                "In Progress"
        ).length;

    document
        .getElementById("pendingTasks")
        .innerText =
        tasks.filter(
            t =>
                t.status ===
                "Pending"
        ).length;
}

document
    .getElementById("closeEditModal")
    .onclick = () => {

        editModal
            .classList.add(
                "hidden"
            );
    };

document
    .getElementById("addTaskBtn")
    .onclick = () => {

        modal.classList.remove(
            "hidden"
        );
    };

document
    .getElementById("closeModal")
    .onclick = () => {

        modal.classList.add(
            "hidden"
        );
    };

document
    .getElementById("syncBtn")
    .onclick =
    async () => {

        const response =
            await fetch(
                "/api/sync",
                {
                    method: "POST"
                }
            );

        const data =
            await response.json();

        if (data.success) {

            alert(
                "Đồng bộ thành công"
            );
        }
        else {

            alert(
                "Lỗi đồng bộ"
            );
        }
    };

document
    .getElementById(
        "exportBtn"
    )
    .onclick = () => {

        window.location.href =
            "/api/export/excel";
    };

document
    .getElementById("saveTask")
    .onclick = async () => {

        const task = {

            taskName:
                document.getElementById(
                    "taskName"
                ).value,

            description:
                document.getElementById(
                    "description"
                ).value,

            deadline:
                document.getElementById(
                    "deadline"
                ).value,

            progress:
                Number(
                    document.getElementById(
                        "progress"
                    ).value
                ),

            note:
                document.getElementById(
                    "note"
                ).value,

            status:
                document.getElementById(
                    "status"
                ).value
        };

        if (
            task.progress < 0 ||
            task.progress > 100
        ) {
            alert(
                "Tiến độ phải từ 0 đến 100%"
            );
            return;
        }

        await fetch(
            `/api/tasks`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(task)
            }
        );

        modal.classList.add(
            "hidden"
        );

        loadTasks();
    };

document
    .getElementById("refreshBtn")
    .onclick = loadTasks;

loadTasks();

async function deleteTask(id) {

    const confirmDelete =
        confirm(
            "Xóa task này?"
        );

    if (!confirmDelete) {
        return;
    }

    await fetch(
        `/api/tasks/${id}`,
        {
            method: "DELETE"
        }
    );

    loadTasks();
}

async function editTask(id) {

    const response =
        await fetch(
            `/api/tasks`
        );

    const data =
        await response.json();

    const task =
        data.tasks.find(
            t => t.id === id
        );

    if (!task) {
        return;
    }

    currentEditId = id;

    document
        .getElementById(
            "editTaskName"
        ).value =
        task.taskName;

    document
        .getElementById(
            "editDescription"
        ).value =
        task.description;

    document
        .getElementById(
            "editDeadline"
        ).value =
        task.deadline;

    document
        .getElementById(
            "editProgress"
        ).value =
        task.progress;

    document
        .getElementById(
            "editNote"
        ).value =
        task.note || "";

    document
        .getElementById(
            "editStatus"
        ).value =
        task.status;

    editModal
        .classList.remove(
            "hidden"
        );
}

setInterval(() => {

    if (
        !document
            .getElementById("taskSection")
            .classList.contains("hidden")
    ) {

        loadTasks();
    }

}, 30000);

document
    .getElementById(
        "updateTaskBtn"
    )
    .onclick =
    async () => {

        const progress =
            Number(
                document
                    .getElementById(
                        "editProgress"
                    )
                    .value
            );

        if (
            progress < 0 ||
            progress > 100
        ) {

            alert(
                "Tiến độ phải từ 0 đến 100%"
            );

            return;
        }

        await fetch(

            `/api/tasks/${currentEditId}`,

            {

                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    taskName:
                        document
                            .getElementById(
                                "editTaskName"
                            )
                            .value,

                    description:
                        document
                            .getElementById(
                                "editDescription"
                            )
                            .value,

                    deadline:
                        document
                            .getElementById(
                                "editDeadline"
                            )
                            .value,

                    progress,

                    note:
                        document
                            .getElementById(
                                "editNote"
                            )
                            .value,

                    status:
                        document
                            .getElementById(
                                "editStatus"
                            )
                            .value
                })
            }
        );

        editModal
            .classList.add(
                "hidden"
            );

        loadTasks();
    };

document
    .getElementById("importBtn")
    .onclick = () => {

        document
            .getElementById("jsonFile")
            .click();
    };

document
    .getElementById("jsonFile")
    .addEventListener(
        "change",
        async (event) => {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }

            const text =
                await file.text();

            const json =
                JSON.parse(text);

            const response =
                await fetch(
                    "/api/import",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(json)
                    }
                );

            const result =
                await response.json();

            if (result.success) {

                alert(
                    "Import thành công"
                );

                loadTasks();
            }
            else {

                alert(
                    "Import thất bại"
                );
            }

            event.target.value = "";
        }
    );