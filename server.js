const express = require("express");
const path = require("path");
const fs = require("fs");

const ExcelJS = require("exceljs");

const DATA_DIR =
    path.join(__dirname, "data");

if (!fs.existsSync(DATA_DIR)) {

    fs.mkdirSync(DATA_DIR);
}

const app = express();
const PORT = 3000;

const { exec } =
    require("child_process");

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

function getFile(name) {

    return path.join(
        DATA_DIR,
        `${name}.json`
    );
}

function readJson(name) {

    const file = getFile(name);

    if (!fs.existsSync(file)) {

        return { tasks: [] };
    }

    return JSON.parse(
        fs.readFileSync(
            file,
            "utf8"
        )
    );
}

function writeJson(name, data) {

    fs.writeFileSync(
        getFile(name),
        JSON.stringify(
            data,
            null,
            4
        )
    );
}

/*
====================
GET TASKS
====================
*/

app.get(
    "/api/tasks",
    (req, res) => {

        const data =
            readJson("tasks");

        res.json(data);
    }
);

/*
====================
ADD TASK
====================
*/

app.post(
    "/api/tasks",
    (req, res) => {

        const data =
            readJson("tasks");

        const task =
            req.body;

        task.id =
            Date.now();

        task.createdAt =
            new Date()
                .toISOString();

        if (
            task.progress < 0
        ) {
            task.progress = 0;
        }

        if (
            task.progress > 100
        ) {
            task.progress = 100;
        }

        data.tasks.push(task);

        writeJson(
            "tasks",
            data
        );

        res.json({
            success: true
        });
    }
);

/*
====================
UPDATE TASK
====================
*/

app.put(
    "/api/tasks/:id",
    (req, res) => {

        const id =
            Number(
                req.params.id
            );

        const data =
            readJson("tasks");

        const task =
            data.tasks.find(
                t => t.id === id
            );

        if (!task) {

            return res
                .status(404)
                .json({
                    success: false
                });
        }

        Object.assign(
            task,
            req.body
        );

        if (
            task.progress < 0
        ) {
            task.progress = 0;
        }

        if (
            task.progress > 100
        ) {
            task.progress = 100;
        }

        writeJson(
            "tasks",
            data
        );

        res.json({
            success: true
        });
    }
);

/*
====================
DELETE TASK
====================
*/

app.delete(
    "/api/tasks/:id",
    (req, res) => {

        const id =
            Number(
                req.params.id
            );

        const data =
            readJson("tasks");

        const task =
            data.tasks.find(
                t => t.id === id
            );

        data.tasks =
            data.tasks.filter(
                t => t.id !== id
            );

        writeJson(
            "tasks",
            data
        );

        res.json({
            success: true
        });
    }
);

/*
====================
GITHUB SYNC
====================
*/

app.post(
    "/api/sync",
    (req, res) => {

        exec(

            'git add . && git commit -m "Auto Sync" && git push origin main',

            {
                cwd: __dirname
            },

            (error, stdout, stderr) => {

                if (error) {

                    return res.json({

                        success: false,

                        error: error.message
                    });
                }

                res.json({

                    success: true,

                    output: stdout
                });
            }
        );
    }
);

/*
====================
IMPORT JSON
====================
*/

app.post(
    "/api/import",
    (req, res) => {

        const data =
            readJson("tasks");

        const importData =
            req.body;

        if (
            !importData.tasks
        ) {

            return res.json({
                success: false
            });
        }

        importData.tasks
            .forEach(task => {

                task.id =
                    Date.now() +
                    Math.floor(
                        Math.random() * 10000
                    );

                data.tasks.push(task);
            });

        writeJson(
            "tasks",
            data
        );

        res.json({

            success: true,

            imported:
                importData.tasks.length
        });
    }
);

/*
====================
EXPORT EXCEL
====================
*/

app.get(
    "/api/export/excel",
    async (req, res) => {

        const data =
            readJson("tasks");

        const workbook =
            new ExcelJS.Workbook();

        const sheet =
            workbook.addWorksheet(
                "Tasks"
            );

        sheet.columns = [

            {
                header: "Tên Task",
                key: "taskName",
                width: 35
            },

            {
                header: "Nội dung",
                key: "description",
                width: 60
            },

            {
                header: "Deadline",
                key: "deadline",
                width: 15
            },

            {
                header: "Tiến độ",
                key: "progress",
                width: 15
            },

            {
                header: "Ghi chú",
                key: "note",
                width: 40
            },

            {
                header: "Trạng thái",
                key: "status",
                width: 18
            }
        ];

        /*
        HEADER STYLE
        */

        sheet.getRow(1).eachCell(cell => {

            cell.font = {

                bold: true,

                color: {
                    argb: "FFFFFFFF"
                }
            };

            cell.fill = {

                type: "pattern",

                pattern: "solid",

                fgColor: {
                    argb: "FFD32F2F"
                }
            };

            cell.alignment = {

                vertical: "middle",

                horizontal: "center"
            };
        });

        /*
====================
TÔ MÀU THEO DEADLINE
====================
*/

        const deadlineGroups = {};

        let colorIndex = 0;

        data.tasks.forEach(task => {

            if (!deadlineGroups[task.deadline]) {

                deadlineGroups[task.deadline] =

                    colorIndex % 2 === 0

                        ? "FFCFE2F3"   // xanh nhạt

                        : "FFEFEFEF";  // xám nhạt

                colorIndex++;
            }
        });

        /*
        DATA
        */

        data.tasks.forEach(task => {

            const row =
                sheet.addRow({

                    taskName:
                        task.taskName,

                    description:
                        task.description,

                    deadline:
                        task.deadline,

                    progress:
                        `${task.progress}%`,

                    note:
                        task.note,

                    status:
                        task.status
                });

            const rowColor =
                deadlineGroups[
                task.deadline
                ];

            row.eachCell(cell => {

                cell.fill = {

                    type: "pattern",

                    pattern: "solid",

                    fgColor: {
                        argb:
                            rowColor
                    }
                };

                cell.border = {

                    top: {
                        style: "thin"
                    },

                    left: {
                        style: "thin"
                    },

                    bottom: {
                        style: "thin"
                    },

                    right: {
                        style: "thin"
                    }
                };

                cell.alignment = {

                    vertical:
                        "middle",

                    wrapText:
                        true
                };
            });

            /*
            QUÁ HẠN -> ĐỎ
            */

            const deadline =
                task.deadline;

            const today =
                new Date();

            const due =
                new Date(
                    deadline
                );

            if (
                due < today &&
                task.status !==
                "Done"
            ) {

                row.eachCell(cell => {

                    cell.fill = {

                        type: "pattern",

                        pattern: "solid",

                        fgColor: {
                            argb:
                                "FFCFE2F3"
                        }
                    };
                });
            }
        });

        /*
        FILTER
        */

        sheet.autoFilter = {

            from: "A1",

            to: "F1"
        };

        /*
        FREEZE HEADER
        */

        sheet.views = [

            {
                state:
                    "frozen",

                ySplit: 1
            }
        ];

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=Tasks.xlsx"
        );

        await workbook.xlsx.write(
            res
        );

        res.end();
    }
);

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );
    }
);