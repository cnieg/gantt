function getUrl() {
    let url = window.location.protocol + "//" + window.location.hostname;
    if (window.location.port !== "") {
        url += ":" + window.location.port;
    }
    url += window.location.pathname;
    return url;
}

function openCreateModal() {
    document.getElementById("createModal").style.display = "block";
}

function onNewGanttIdChange() {
    document.getElementById("newGanttUrl").innerText = getUrl() + "?id=" + document.getElementById("newGanttId").value;
}

function closeCreateModal() {
    document.getElementById("createModal").style.display = "none";
}

function create() {
    const id = document.getElementById("newGanttId").value;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    if (id === "" || startDate === "" || endDate === "") {
        gantt.message({type: "error", text: "Tous les champs sont obligatoires", expire: 5000});
    } else {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/" + id, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                gantt.message({type: "info", text: "Création réussie, redirection dans 5 sec", expire: 5000});
                setTimeout(function () {
                    window.location.href = getUrl() + "?id=" + id;
                }, 5000);
            }
        }
        xhr.send(JSON.stringify({
            "startDate": startDate,
            "endDate": endDate,
            "scale": "hour",
            "gantt": {
                data: [],
                links: []
            }
        }));
    }
}

function save() {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/" + id, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            gantt.message({text: "Sauvegarde réussie", expire: 5});
        }
    }
    xhr.send(JSON.stringify({
        "startDate": document.getElementById("start-date").value,
        "endDate": document.getElementById("end-date").value,
        "scale": document.getElementById("scale").value,
        "gantt": gantt.serialize()
    }));
}

function exportJson() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gantt.serialize()));
    let dlAnchorElem = document.getElementById('dl_hidden_link');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "data.json");
    dlAnchorElem.click();
}

function unselectTasks() {
    gantt.eachSelectedTask(function (item) {
        gantt.unselectTask(item.id);
    });
}

function getStatus() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/status");
    xhr.onload = function () {
        if (xhr.status === 200) {
            let json = JSON.parse(this.responseText);
            gantt.serverList("status", json);
            getTeams();
        }
    };
    xhr.send();
}

function getTeams() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/team");
    xhr.onload = function () {
        if (xhr.status === 200) {
            let json = JSON.parse(this.responseText);
            gantt.serverList("team", json);
            configureGantt();
        }
    };
    xhr.send();
}

function getData() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/" + id);
    xhr.onload = function () {
        if (xhr.status === 200) {
            let json = JSON.parse(this.responseText);
            document.getElementById("start-date").value = json.startDate;
            document.getElementById("end-date").value = json.endDate;
            document.getElementById('scale').value = json.scale;

            for(let i = 0 ; i < zoomConfig['levels'].length ; i++) {
                if(zoomConfig['levels'][i].name === json.scale) {
                    gantt.config.scales = zoomConfig['levels'][i].scales;
                }
            }

            gantt.init("gantt_here", new Date(json.startDate), new Date(json.endDate));
            gantt.parse(json.gantt);
            colorize();
        }
    };
    xhr.send();
}

function colorize() {
    let styleId = "dynamicGanttStyles";
    let element = document.getElementById(styleId);
    if (!element) {
        element = document.createElement("style");
        element.id = styleId;
        document.querySelector("head").appendChild(element);
    }
    let html = [];
    let resources = gantt.serverList("team");
    let status = gantt.serverList("status");

    resources.forEach(function (r) {
        html.push(".gantt_task_line.gantt_resource_" + r.key + "{" +
            "background-color:" + r.backgroundColor + "; " +
            "color:" + r['textColor'] + ";" +
            "}");
        html.push(".gantt_row.gantt_resource_" + r.key + " .gantt_cell:nth-child(3) .gantt_tree_content{" +
            "background-color:" + r.backgroundColor + "; " +
            "color:" + r['textColor'] + ";" +
            "}");
    });
    status.forEach(function (r) {
        html.push(".gantt_row .gantt_status_" + r.key + "{" +
            "border-radius: 5px;" +
            "padding: 5px;" +
            "background-color:" + r.backgroundColor + "; " +
            "color:" + r['textColor'] + ";" +
            "}");
    })
    element.innerHTML = html.join("");
}

function configureGantt() {

    gantt.plugins({
        tooltip: true,
        multiselect: true,
        click_drag: true,
        marker: true
    });

    gantt.locale.labels["section_parent"] = "Tâche parente";
    let labels = gantt.locale.labels;
    gantt.locale.labels.column_owner = labels.section_owner = "Charge";
    gantt.locale.labels.column_team = labels.section_team = "Équipe";
    gantt.locale.labels.column_owner = labels.section_owner = "Acteur";
    gantt.locale.labels.column_status = labels.section_status = "Statut";

    /* LEFT COLUMN CONFIG */

    gantt.config.columns = [{
        name: "text",
        label: "Tâche",
        tree: true,
        width: '*'
    }, {
        name: "duration",
        label: "Durée",
        width: '50',
        template: function (item) {
            if (item.duration < 60) {
                return item.duration + "m";
            } else if (item.duration < 60 * 24) {
                return (item.duration / 60).toFixed(1) + "h";
            } else {
                return (item.duration / (60 * 24)).toFixed(1) + "j";
            }
        }
    }, {
        name: "team",
        label: "Équipe",
        width: 60,
        align: "center",
        resize: true,
        template: function (item) {
            return getLabelById(gantt.serverList('team'), item['team_id'])
        }
    }, {
        name: "load",
        align: "center",
        width: 60,
        label: "Charge"
    }, {
        name: "owner",
        align: "center",
        width: 80,
        label: "Acteur"
    }, {
        name: "status",
        label: "Statut",
        width: 70,
        align: "center",
        resize: true,
        template: function (item) {
            return '<span class="gantt_status_' + item['status_id'] + '">' + getLabelById(gantt.serverList('status'), item['status_id']) + '</span>';
        }
    }, {
        name: "add",
        width: 40
    }];

    /* LIGHTBOX MODAL */

    gantt.config.lightbox.sections = [{
        name: "description",
        height: 30,
        map_to: "text",
        type: "textarea",
        focus: true
    }, {
        name: "team",
        height: 30,
        map_to: "team_id",
        type: "select",
        options: gantt.serverList("team")
    }, {
        name: "owner",
        height: 30,
        map_to: "owner",
        type: "textarea",
        unassigned_value: 1
    }, {
        name: "status",
        height: 30,
        map_to: "status_id",
        type: "select",
        options: gantt.serverList("status")
    }, {
        name: "parent",
        type: "parent",
        allow_root: "true",
        root_label: "No parent"
    }, {
        name: "time",
        type: "duration",
        map_to: "auto"
    }];

    /* CSS ADAPTATION */

    gantt.templates.grid_row_class =
        gantt.templates.task_row_class =
            gantt.templates.task_class = function (start, end, task) {
                let css = [];
                if (task['team_id']) {
                    css.push("gantt_resource_task gantt_resource_" + task['team_id']);
                }
                return css.join(" ");
            };

    gantt.templates.scale_cell_class = function (date) {
        if (date.getDay() === 0 || date.getDay() === 6) {
            return "weekend";
        }
    };
    gantt.templates.timeline_cell_class = function (item, date) {
        if (date.getDay() === 0 || date.getDay() === 6) {
            return "weekend"
        }
    };

    /* NOW MARKER */

    let dateToStr = gantt.date.date_to_str(gantt.config.task_date);
    let today = new Date();
    gantt.addMarker({
        start_date: today,
        css: "now",
        text: "Maintenant",
        title: "Maintenant: " + dateToStr(today)
    });

    /* CUSTOM UNITS */

    gantt.date.half_day_start = function(date) {
        let next = new Date(date);
        if(next.getHours() >= 0 && next.getHours() < 12) {
            next.setHours(0);
        } else {
            next.setHours(12);
        }
        return next;
    };

    gantt.date.add_half_day = function(date, inc){
        return gantt.date.add(date, inc * 12, "hour");
    };

    /* EVENTS */

    gantt.attachEvent("onGanttReady", function () {
        let tooltips = gantt.ext.tooltips;
        tooltips.tooltip.setViewport(gantt.$task_data);
    });

    gantt.attachEvent("onTaskCreated", function (task) {
        switch(document.getElementById("scale").value) {
            case "hour":
                task.duration = 20;
                break;
            case "day":
                task.duration = 120;
                break;
            case "week":
                task.duration = 1440;
                break;
            case "month":
                task.duration = 7200;
                break;
        }
        if(task.parent > 0) {
            parent.type = gantt.config.types.project;
        }
        return true;
    });

    gantt.attachEvent("onAfterTaskUpdate", function (taskId) {
        setProjectRecursive(taskId, 0);
        return true;
    });

    /* MAIN CONFIG */

    gantt.config.grid_width = 512;
    gantt.config.grid_resize = true;
    gantt.config.open_tree_initially = false;

    gantt.config.date_format = "%d-%m-%Y %H:%i";
    gantt.config.duration_unit = "minute";
    gantt.config.min_duration = 5*60*1000;
    gantt.config.scale_height = 75;

    gantt.config.show_tasks_outside_timescale = true;
    gantt.config.order_branch = true;
    gantt.config.multiselect = true;
    gantt.config.click_drag = {
        callback: onDragEnd
    };
    gantt.config.autoscroll = true;
    gantt.config.autoscroll_speed = 50;

    gantt.ext.zoom.init(zoomConfig);
    gantt.ext.zoom.setLevel("hour");

    getData();
}

function getLabelById(list, id) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].key.toString() === id)
            return list[i].label || "";
    }
    return "";
}

function onDragEnd(startPoint, endPoint, startDate, endDate, tasksBetweenDates) {
    unselectTasks();
    tasksBetweenDates.forEach(function (item) {
        gantt.selectTask(item.id);
    });
}

function updateScale() {
    gantt.ext.zoom.setLevel(document.getElementById("scale").value);
}

function setProjectRecursive(taskId, level) {
    let task = gantt.getTask(taskId);
    if((!task.parent || task.parent.toString() === '0') && level > 0) {
        task.type = gantt.config.types.project;
        delete task['status_id'];
        delete task['team_id'];
    } else if(task.parent > 0 && level > 0) {
        task.type = gantt.config.types.project;
        delete task['status_id'];
        delete task['team_id'];
        setProjectRecursive(task.parent, level + 1);
    } else if(task.parent > 0) {
        setProjectRecursive(task.parent, level + 1);
    }
}

function halfDayFormat(date) {
    let hour = date.getHours();
    if (hour >= 0 && hour < 12) {
        return "AM";
    }
    else {
        return "PM";
    }
}

function toggleFullScreen() {
    if (!isFullScreen) {
        document.getElementsByTagName('body')[0].requestFullscreen().then(r => {
            document.getElementById('toggleFullScreenBtn').innerText = 'Sortir du plein écran';
            isFullScreen = true;
        });
    }
    if (isFullScreen) {
        document.exitFullscreen().then(r => {
            document.getElementById('toggleFullScreenBtn').innerText = 'Plein écran';
            isFullScreen = false;
        });
    }
}

let isFullScreen = false;

let zoomConfig = {
    levels: [
        {
            name: "hour",
            min_column_width: 30,
            scales: [
                {unit: "day", step: 1, format: "%j %F, %l"},
                {unit: "hour", step: 1, format: "%G"},
                {unit: "minute", step: 5, format: "%i"}
            ]
        },
        {
            name: "day",
            min_column_width: 30,
            scales: [
                {unit: "day", step: 1, format: "%j %F, %l"},
                {unit: "hour", step: 1, format: "%G"}
            ]
        },
        {
            name: "week",
            min_column_width: 30,
            scales: [
                {unit: "week", format: "S%W"},
                {unit: "day", format: "%j"},
                {unit: "half_day", format: halfDayFormat}
            ]
        },
        {
            name: "month",
            min_column_width: 30,
            scales: [
                {unit: "month", step: 1, format: "%M"},
                {unit: "week", step: 1, format: "S%W"},
                {unit: "day", step: 1, format: "%j"}
            ]
        }
    ]
};

const urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get('id');

if (id === undefined) {
    openCreateModal();
} else {
    document.title = "Gantt : " + id;
    getStatus();
}

