const fs = require("fs");
const tasksFile = "./task.txt";
const completedTasksFile = "./completed.txt";
const [, , ...args] = process.argv;
const numOfArgs = args.length;

const help_message = `Usage :-
$ ./task add 2 hello world    # Add a new item with priority 2 and text "hello world" to the list
$ ./task ls                   # Show incomplete priority list items sorted by priority in ascending order
$ ./task del INDEX            # Delete the incomplete item with the given index
$ ./task done INDEX           # Mark the incomplete item with the given index as complete
$ ./task help                 # Show usage
$ ./task report               # Statistics`

// Create task.txt if not exists
if (!fs.existsSync(tasksFile)) {
    fs.closeSync(fs.openSync(tasksFile, 'w'));
}

// Create completed.txt if not exists
if (!fs.existsSync(completedTasksFile)) {
    fs.closeSync(fs.openSync(completedTasksFile, 'w'));
}


// Print the help message
function help() {
    console.log(help_message);
}


// Order the tasks along with serial numbers for display
function orderTasks(taskList, completedTasks = false) {

    let taskData = ``;

    taskList.forEach((task, i) => {

        let message = completedTasks ? task : task.substring(task.indexOf(" ") + 1);

        taskData += `${i + 1}. ${message}`;

        if (!completedTasks) {
            let priority = task.substring(0, task.indexOf(" "));
            taskData += ` [${priority}]`;
        }

        if (i !== taskList.length - 1)
            taskData += `\n`;

    });

    return taskData;
}


// Read tasks from task.txt/completed.txt & return them 
function readFromFile(filePath) {

    return new Promise(function (resolve, reject) {
        let taskList = [];

        fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {

            if (err) reject(err);

            if (data) {
                taskList = data.split(/\r?\n/);
            }
            resolve(taskList);
        });
    })
}


// Write pending/completed tasks to task.txt/completed.txt
function writeToFile(filePath, taskList, taskCompleted) {

    let taskData = ``;

    if (!taskCompleted) {
        taskList.sort(function (task1, task2) {
            const task1priority = Number(task1.split(" ")[0]);
            const task2priority = Number(task2.split(" ")[0]);
            return task1priority - task2priority;
        });
    }

    taskList.forEach((task, i) => {
        taskData = taskData + task;
        if (i !== taskList.length - 1) {
            taskData = taskData + `\n`;
        }
    })

    fs.writeFile(filePath, taskData, function (err) {
        if (err) throw err;
    })
}


// Add a new task to task.txt
function addTask(message, priority) {
    let filePath = tasksFile;
    readFromFile(filePath).then(taskList => {
        let newTask = `${priority} ${message}`;
        taskList.push(newTask);
        writeToFile(filePath, taskList, false);
        console.log(`Added task: "${message}" with priority ${priority}`);
    })
}


// List all tasks
function listTasks() {
    readFromFile(tasksFile).then(taskList => {
        let taskData = orderTasks(taskList);
        if (taskData)
            console.log(taskData);
        else
            console.log("There are no pending tasks!");
    })
}


// Delete task from task.txt by index 
function deleteTask(index, flag = true) {

    let filePath = tasksFile;

    readFromFile(filePath).then(taskList => {
        if (taskList.length && index <= taskList.length) {
            taskList.splice(index - 1, 1);
            writeToFile(filePath, taskList, false);
            if (flag)
                console.log(`Deleted task #${index}`);
        } else {
            console.log(`Error: task with index #${index} does not exist. Nothing deleted.`);
        }
    });

}


// Mark a task as complete
function completeTask(index) {
    readFromFile(tasksFile).then(pendingTaskList => {
        if (pendingTaskList.length && index <= pendingTaskList.length) {
            let completedTask = pendingTaskList.splice(index - 1, 1)[0];
            completedTask = completedTask.substring(completedTask.indexOf(" ") + 1);
            deleteTask(index, false);
            readFromFile(completedTasksFile).then(completedTaskList => {
                completedTaskList.push(completedTask);
                writeToFile(completedTasksFile, completedTaskList, true);
                console.log(`Marked item as done.`)
            });
        } else {
            console.log(`Error: no incomplete item with index #${index} exists.`);
        }
    });
}


// Generate a report of pending tasks & completed tasks
function report() {
    readFromFile(tasksFile).then(taskList => {
        let taskData = orderTasks(taskList);
        console.log(`Pending : ${taskList.length}`);
        if (taskData)
            console.log(taskData);
        console.log();
    })

    readFromFile(completedTasksFile).then(taskList => {
        let taskData = orderTasks(taskList, true);
        console.log(`Completed : ${taskList.length}`);
        if (taskData)
            console.log(taskData);
    })

}


if (numOfArgs === 0) {
    help();
}
else if (numOfArgs === 1) {
    switch (args[0]) {
        case "help": help();
            break;
        case "ls": listTasks();
            break;
        case "report": report();
            break;
        case "add": console.log("Error: Missing tasks string. Nothing added!");
            break;
        case "del": console.log("Error: Missing NUMBER for deleting tasks.");
            break;
        case "done": console.log("Error: Missing NUMBER for marking tasks as done.");
            break;
    }
} else if (numOfArgs === 2) {
    switch (args[0]) {

        case "add": console.log("Error: Missing tasks string. Nothing added!");
            break;

        case "del":

            if (!isNaN(args[1]) && Number.isInteger(Number(args[1])) && Number(args[1]) > 0) {
                deleteTask(Number(args[1]));
            } else {
                console.log(`Error: task with index #${args[1]} does not exist. Nothing deleted.`);
            }
            break;

        case "done":

            if (!isNaN(args[1]) && Number.isInteger(Number(args[1])) && Number(args[1]) > 0) {
                completeTask(Number(args[1]));
            } else {
                console.log(`Error: no incomplete item with index #${args[1]} exists.`);
            }
            break;
    }
} else if (numOfArgs > 2 && (args[0] === "add" && (!isNaN(args[1]) && Number.isInteger(Number(args[1])) && args[1] >= 0))) {
    addTask(args[2], args[1]);
}