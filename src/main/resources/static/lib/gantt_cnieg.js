
function getUrl() {
    var url = window.location.protocol + "//" +
        window.location.hostname;
    if(window.location.port !== "") {
        url+= ":" + window.location.port;
    }
    url+= window.location.pathname;
    return url;
}

function getUrlVars() {
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function openCreateModal() {
    document.getElementById("createModal").style.display = "block";
}

function onNewGanttIdChange() {
    document.getElementById("newGanttUrl").innerText =
        getUrl() + "?id=" +
        document.getElementById("newGanttId").value;
}

function closeCreateModal() {
    document.getElementById("createModal").style.display = "none";
}

function create() {
    const id = document.getElementById("newGanttId").value;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    if(id === "" || startDate === "" || endDate === "") {
        gantt.message({type: "error", text: "Tous les champs sont obligatoires", expire: 5000});
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/" + id, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                gantt.message({type: "info", text: "Création réussie, redirection dans 5 sec", expire: 5000});
                setTimeout(function() {
                    window.location.href = getUrl() + "?id=" + id;
                }, 5000);
            }
        }
        xhr.send(JSON.stringify({
            "startDate": startDate,
            "endDate": endDate,
            "gantt": {
                data: [],
                links: []
            }
        }));
    }
}

function save() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/" + getUrlVars().id, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            gantt.message({text: "Sauvegarde réussie", expire: 5});
        }
    }
    xhr.send(JSON.stringify({
        "startDate": document.getElementById("start-date").value,
        "endDate": document.getElementById("end-date").value,
        "gantt" : gantt.serialize()
    }));
}

function exportJson() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gantt.serialize()));
    var dlAnchorElem = document.getElementById('dl_hidden_link');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "data.json");
    dlAnchorElem.click();
}

function unselectTasks() {
    gantt.eachSelectedTask(function(item) {
        gantt.unselectTask(item.id);
    });
}

function getStaff() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/staff");
    xhr.onload = function() {
        if (xhr.status === 200) {
            var json = JSON.parse(this.responseText);
            gantt.serverList("staff", json);
            configureGantt();
        }
    };
    xhr.send();
}

function getData() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/" + getUrlVars().id);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var json = JSON.parse(this.responseText);
            document.getElementById("start-date").value = json.startDate;
            document.getElementById("end-date").value = json.endDate;
            zoomConfig.startDate = new Date(json.startDate);
            zoomConfig.endDate = new Date(json.endDate);
            gantt.ext.zoom.init(zoomConfig);
            gantt.init("gantt_here", new Date(json.startDate), new Date(json.endDate));
            gantt.parse(json.gantt);
            colorize();
        }
    };
    xhr.send();
}

function colorize() {
    var styleId = "dynamicGanttStyles";
    var element = document.getElementById(styleId);
    if (!element) {
        element = document.createElement("style");
        element.id = styleId;
        document.querySelector("head").appendChild(element);
    }
    var html = [];
    var resources = gantt.serverList("staff");

    resources.forEach(function(r) {
        html.push(".gantt_task_line.gantt_resource_" + r.key + "{" +
            "background-color:" + r.backgroundColor + "; " +
            "color:" + r.textColor + ";" +
            "}");
        html.push(".gantt_row.gantt_resource_" + r.key + " .gantt_cell:nth-child(1) .gantt_tree_content{" +
            "background-color:" + r.backgroundColor + "; " +
            "color:" + r.textColor + ";" +
            "}");
    });
    element.innerHTML = html.join("");
    document.getElementById("zoomAutoButton").click();
}

function configureGantt() {

    gantt.plugins({
        tooltip: true,
        multiselect: true,
        click_drag: true
    });

    gantt.attachEvent("onGanttReady", function() {
        var tooltips = gantt.ext.tooltips;
        tooltips.tooltip.setViewport(gantt.$task_data);
    });

    gantt.config.grid_width = 420;
    gantt.config.grid_resize = true;
    gantt.config.open_tree_initially = true;

    gantt.config.date_format = "%d-%m-%Y %H:%i";
    gantt.config.min_column_width = 20;
    gantt.config.duration_unit = "minute";
    gantt.config.duration_step = 1;
    gantt.config.scale_height = 75;

    gantt.config.scales = [{
        unit: "hour",
        step: 1,
        format: "%g %a"
    }, {
        unit: "day",
        step: 1,
        format: "%j %F, %l"
    }, {
        unit: "minute",
        step: 5,
        format: "%i"
    }];

    gantt.locale.labels["section_parent"] = "Tâche parente";
    var labels = gantt.locale.labels;
    gantt.locale.labels.column_owner = labels.section_owner = "Owner";

    function byId(list, id) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].key == id)
                return list[i].label || "";
        }
        return "";
    }

    gantt.config.columns = [{
        name: "owner",
        label: "Equipe",
        width: 80,
        align: "center",
        template: function(item) {
            return byId(gantt.serverList('staff'), item.owner_id)
        }
    }, {
        name: "text",
        label: "Tâche",
        tree: true,
        width: 150
    }, {
        name: "duration",
        label: "Durée",
        tree: true,
        width: '*',
        template: function(item) {
            return item.duration + " min"
        }
    }, {
        name: "add",
        width: 40
    }];

    gantt.config.lightbox.sections = [{
        name: "description",
        height: 38,
        map_to: "text",
        type: "textarea",
        focus: true
    }, {
        name: "owner",
        height: 22,
        map_to: "owner_id",
        type: "select",
        options: gantt.serverList("staff")
    }, {
        name: "parent",
        type: "parent",
        allow_root: "true",
        root_label: "No parent",
        filter: function(id, task) {
            /*	if(task.$level > 1){
                    return false;
                }else{
                    return true;
                }*/
            return true;
        }
    }, {
        name: "time",
        type: "duration",
        map_to: "auto"
    }];

    gantt.templates.rightside_text = function(start, end, task) {
        return byId(gantt.serverList('staff'), task.owner_id);
    };

    gantt.templates.grid_row_class =
        gantt.templates.task_row_class =
            gantt.templates.task_class = function(start, end, task) {
                var css = [];
                if (task.$virtual || task.type == gantt.config.types.project)
                    css.push("summary-bar");

                if (task.owner_id) {
                    css.push("gantt_resource_task gantt_resource_" + task.owner_id);
                }

                return css.join(" ");
            };

    gantt.config.min_column_width = 80;
    gantt.config.order_branch = true;
    gantt.config.multiselect = true;
    gantt.config.click_drag = {
        callback: onDragEnd
    };
    gantt.config.autoscroll = true;
    gantt.config.autoscroll_speed = 50;

    getData();
}

let hourToStr = gantt.date.date_to_str("%H:%i");
let hourRangeFormat = function (step) {
    return function(date) {
        var intervalEnd = new Date(gantt.date.add(date, step, "hour") - 1)
        return hourToStr(date) + " - " + hourToStr(intervalEnd);
    };
}

let zoomConfig = {
    minColumnWidth: 80,
    maxColumnWidth: 150,
    levels: [
        [{
            unit: "month",
            format: "%M %Y",
            step: 1
        }, {
            unit: "week",
            step: 1,
            format: function(date) {
                var dateToStr = gantt.date.date_to_str("%d %M");
                var endDate = gantt.date.add(date, -6, "day");
                var weekNum = gantt.date.date_to_str("%W")(date);
                return "Week #" + weekNum + ", " + dateToStr(date) + " - " + dateToStr(endDate);
            }
        }],
        [{
            unit: "month",
            format: "%M %Y",
            step: 1
        }, {
            unit: "day",
            format: "%d %M",
            step: 1
        }],
        [{
            unit: "day",
            format: "%d %M",
            step: 1
        }, {
            unit: "hour",
            format: hourRangeFormat(12),
            step: 12
        }],
        [{
            unit: "day",
            format: "%d %M",
            step: 1
        }, {
            unit: "hour",
            format: hourRangeFormat(6),
            step: 6
        }],
        [{
            unit: "day",
            format: "%d %M",
            step: 1
        }, {
            unit: "hour",
            format: "%H:%i",
            step: 1
        }],
        [{
            unit: "hour",
            step: 1,
            format: "%g %a"
        }, {
            unit: "day",
            step: 1,
            format: "%j %F, %l"
        }, {
            unit: "minute",
            step: 15,
            format: "%i"
        }],
        [{
            unit: "hour",
            step: 1,
            format: "%g %a"
        }, {
            unit: "day",
            step: 1,
            format: "%j %F, %l"
        }, {
            unit: "minute",
            step: 5,
            format: "%i"
        }]
    ],
    startDate: new Date(2020, 1, 1),
    endDate: new Date(2020, 1, 1),
    useKey: "ctrlKey",
    trigger: "wheel",
    element: function() {
        return gantt.$root.querySelector(".gantt_task");
    }
}

function onDragEnd(startPoint, endPoint, startDate, endDate, tasksBetweenDates, tasksInRows) {
    unselectTasks();
    tasksBetweenDates.forEach(function(item) {
        gantt.selectTask(item.id);
    });
}

function toggleMode(toggle) {
    toggle.enabled = !toggle.enabled;
    if (toggle.enabled) {
        toggle.innerHTML = "Zoom précédent";
        //Saving previous scale state for future restore
        saveConfig();
        zoomToFit();
    } else {

        toggle.innerHTML = "Zoom Auto";
        //Restore previous scale state
        restoreConfig();
        gantt.render();
    }
}

var cachedSettings = {};

function saveConfig() {
    var config = gantt.config;
    cachedSettings = {};
    cachedSettings.scales = config.scales;
    cachedSettings.start_date = config.start_date;
    cachedSettings.end_date = config.end_date;
}

function restoreConfig() {
    applyConfig(cachedSettings);
}

function applyConfig(config, dates) {

    gantt.config.scales = config.scales;

    if (dates && dates.start_date && dates.end_date) {
        gantt.config.start_date = gantt.date.add(dates.start_date, -1, config.scales[0].subscale_unit);
        gantt.config.end_date = gantt.date.add(gantt.date[config.scales[0].subscale_unit + "_start"](dates.end_date), 2, config.scales[0].subscale_unit);
    } else {
        gantt.config.start_date = gantt.config.end_date = null;
    }
}


function zoomToFit() {
    var project = gantt.getSubtaskDates(),
        areaWidth = gantt.$task.offsetWidth;

    for (var i = 0; i < scaleConfigs.length; i++) {
        var columnCount = getUnitsBetween(project.start_date, project.end_date, scaleConfigs[i].scales[0].subscale_unit, scaleConfigs[i].scales[0].step);
        if ((columnCount + 2) * gantt.config.min_column_width >= areaWidth) {
            --i;
            break;
        }
    }


    if (i == scaleConfigs.length) {
        i--;
    }

    applyConfig(scaleConfigs[i], project);
    gantt.render();
}

// get number of columns in timeline
function getUnitsBetween(from, to, unit, step) {
    var start = new Date(from),
        end = new Date(to);
    var units = 0;
    while (start.valueOf() < end.valueOf()) {
        units++;
        start = gantt.date.add(start, step, unit);
    }
    return units;
}

//Setting available scales
var scaleConfigs = [
    // decades
    {
        scales: [{
            subscale_unit: "year",
            unit: "year",
            step: 10,
            template: function(date) {
                var dateToStr = gantt.date.date_to_str("%Y");
                var endDate = gantt.date.add(gantt.date.add(date, 10, "year"), -1, "day");
                return dateToStr(date) + " - " + dateToStr(endDate);
            }
        }, {
            unit: "year",
            step: 100,
            template: function(date) {
                var dateToStr = gantt.date.date_to_str("%Y");
                var endDate = gantt.date.add(gantt.date.add(date, 100, "year"), -1, "day");
                return dateToStr(date) + " - " + dateToStr(endDate);
            }
        }]
    },
    // years
    {
        scales: [{
            subscale_unit: "year",
            unit: "year",
            step: 1,
            date: "%Y"
        }, {
            unit: "year",
            step: 5,
            template: function(date) {
                var dateToStr = gantt.date.date_to_str("%Y");
                var endDate = gantt.date.add(gantt.date.add(date, 5, "year"), -1, "day");
                return dateToStr(date) + " - " + dateToStr(endDate);
            }
        }]
    },
    // quarters
    {
        scales: [{
            subscale_unit: "month",
            unit: "year",
            step: 3,
            format: "%Y"
        }, {
            unit: "month",
            step: 3,
            template: function(date) {
                var dateToStr = gantt.date.date_to_str("%M");
                var endDate = gantt.date.add(gantt.date.add(date, 3, "month"), -1, "day");
                return dateToStr(date) + " - " + dateToStr(endDate);
            }
        }]
    },
    // months
    {
        scales: [{
            subscale_unit: "month",
            unit: "year",
            step: 1,
            format: "%Y"
        }, {
            unit: "month",
            step: 1,
            format: "%M"
        }]
    },
    // weeks
    {
        scales: [{
            subscale_unit: "week",
            unit: "month",
            step: 1,
            date: "%F"
        }, {
            unit: "week",
            step: 1,
            template: function(date) {
                var dateToStr = gantt.date.date_to_str("%d %M");
                var endDate = gantt.date.add(gantt.date.add(date, 1, "week"), -1, "day");
                return dateToStr(date) + " - " + dateToStr(endDate);
            }
        }]
    },
    // days
    {
        scales: [{
            subscale_unit: "day",
            unit: "month",
            step: 1,
            format: "%F"
        }, {
            unit: "day",
            step: 1,
            format: "%j"
        }]
    },
    // hours
    {
        scales: [{
            subscale_unit: "hour",
            unit: "day",
            step: 1,
            format: "%j %M"
        }, {
            unit: "hour",
            step: 1,
            format: "%H:%i"
        }

        ]
    },
    // minutes
    {
        scales: [{
            subscale_unit: "minute",
            unit: "hour",
            step: 1,
            format: "%H"
        }, {
            unit: "minute",
            step: 1,
            format: "%H:%i"
        }]

    }
];

var id = getUrlVars().id;
if(getUrlVars().id === undefined) {
    openCreateModal();
} else {
    document.title = "Gantt : " + id;
    getStaff();
}

