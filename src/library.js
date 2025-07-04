sap.ui.define([], function () {
  "use strict";
  sap.ui.getCore().initLibrary({
    name: "innova",
    version: "1.0.0",
    dependencies: ["sap.ui.core", "sap.m", "sap.ui.table"],
    types: [],
    interfaces: [],
    controls: ["innova.controls.InnovaSimpleTable"],
    elements: []
  });
  return innova;
});
