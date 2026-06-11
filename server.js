const express = require("express");
const path = require("path");
const fs = require("fs");

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

        addLog(
            "tasks",
            "CREATE",
            task.taskName
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

        addLog(
            "tasks",
            "UPDATE",
            task.taskName
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

        addLog(
            "tasks",
            "DELETE",
            task?.taskName || ""
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
                success:false
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

            success:true,

            imported:
                importData.tasks.length
        });
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