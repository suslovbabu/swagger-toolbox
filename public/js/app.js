var jsonEditor = CodeMirror.fromTextArea(document.getElementById("myTextarea"), {
    lineNumbers: true,
    mode: "application/json",
    gutters: ["CodeMirror-lint-markers"],
    lint: true,
    lintOnChange: true
});

var yamlEditor = CodeMirror.fromTextArea(document.getElementById("myTextarea2"), {
    mode: "yaml",
    readOnly: true
});
var jsonEditor2 = CodeMirror.fromTextArea(document.getElementById("myTextarea3"), {
    mode: "application/json",
    readOnly: true
});
var statusChange = function(state) { document.getElementById("status").className = state };
var statusMessage = function(message) { document.getElementById("statusMessage").innerHTML = message };

function processJSON() {
    var jsonString = jsonEditor.getValue().trim();
    if (this.tryParseJSON(jsonString) === true) {
        statusMessage("Valid json ✔");
        statusChange("toast pt-10 toast-success");
        var json = JSON.parse(jsonString);
        var yamlReady = this.buildSwaggerJSON(json);
        console.log(yamlReady);
        jsonEditor2.setValue(JSON.stringify(yamlReady, null, 4));
        var x = stringify(yamlReady);
        yamlEditor.setValue(x);
        statusMessage("Convertion complete ✔");
        statusChange("toast pt-10 toast-success");

    } else {
        statusMessage("Invalid JSON. Have properties names in quotes");
        statusChange("toast pt-10 toast-danger");
    }
}

function tryParseJSON(jsonString) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return true;
        }
    } catch (e) {
        console.error(e, jsonString);
        return false;
    }

    return false;
}

function buildSwaggerJSON(data) {
    var keys = Object.keys(data)
    var op = { required: keys, properties: {} };
    keys.forEach(function(x) {
        var typeData = typeOf(data[x]);
        if (["array", "object", "null"].indexOf(typeData) === -1)
            op.properties[x] = { "type": typeData };
        else {
            switch (typeData) {
                case "array":
                    typeData = typeOf(data[x][0]);
                    if (typeData === "array") {
                        // op.properties[x] = { "type": "array", "items": { type: typeData } };
                        throw new Error("Complex object (array of array etc...)", data[x][0]);
                    }
                    if (typeData === "object") {
                        op.properties[x] = { "type": "array", "items": { type: typeData, properties: buildSwaggerJSON(data[x][0]).properties } };
                        break;
                    }
                    op.properties[x] = { "type": "array", "items": { type: typeData } };

                    break;
                case "object":
                    op.properties[x] = buildSwaggerJSON((data[x]));
                    op.properties[x].type = "object";
                    break;
                case "null":
                    op.properties[x] = { "type": "unknown" };
                    break;
                default:
                    console.warn("skipping ", typeData);
                    break;
            }
        }
    });
    return op;
}