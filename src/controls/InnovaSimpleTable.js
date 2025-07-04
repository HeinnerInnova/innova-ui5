sap.ui.define(
  [
    "sap/ui/core/Control",
    "sap/ui/table/Table",
    "sap/m/OverflowToolbar",
    "sap/m/Button",
    "sap/m/Title",
    "sap/m/ToolbarSpacer",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/Input",
    "sap/m/Label",
    "sap/ui/core/CustomData",
  ],
  function (
    Control,
    Table,
    OverflowToolbar,
    Button,
    Title,
    ToolbarSpacer,
    Column,
    Text,
    VBox,
    Input,
    Label,
    CustomData
  ) {
    return Control.extend("innova.controls.InnovaSimpleTable", {
      metadata: {
        properties: {
          controller: { type: "any" },
          rowsPath: { type: "string" },
          columnsPath: { type: "string" },
          enableEditionPath: { type: "string" },
          titleText: { type: "string" },
          factoryName: { type: "string" },
          factory: { type: "string" },

          selectionMode: { type: "string", defaultValue: "MultiToggle" },
          alternateRowColors: { type: "boolean", defaultValue: true },
          ariaLabelledBy: { type: "string" },
        },
        events: {
          rowSelectionChange: {},
          firstVisibleRowChanged: {},
          pressSave: {},
          pressCopy: {},
          pressDelete: {},
          pressAdd: {},
          pressCancel: {},
          pressEdit: {},
        },
        aggregations: {
          _table: {
            type: "sap.ui.table.Table",
            multiple: false,
            visibility: "hidden",
          },
        },
      },

      init() {
        const oTable = new Table({
          alternateRowColors: true,
          selectionMode: "MultiToggle",
          ariaLabelledBy: [],
          visibleRowCountMode: "Auto",
          rowHeight: 85,
          rowSelectionChange: (oEvent) => this.fireRowSelectionChange(oEvent),
          firstVisibleRowChanged: (oEvent) =>
            this.fireFirstVisibleRowChanged(oEvent),
        });

        this.setAggregation("_table", oTable);
      },

      onBeforeRendering() {
        const oTable = this.getAggregation("_table");
        if (!oTable) return;

        oTable.setSelectionMode(this.getSelectionMode());
        oTable.setAlternateRowColors(this.getAlternateRowColors());
        oTable.setAriaLabelledBy(this.getAriaLabelledBy());

        oTable.bindRows({
          path: this.getRowsPath(),
          templateShareable: true,
        });

        let fnFactory;
        const sFactoryName = this.getFactory();
        const oController = this.getController();

        if (sFactoryName && oController) {
          const sNormalizedFactoryName = sFactoryName.startsWith(".")
            ? sFactoryName.substring(1)
            : sFactoryName;

          let fnRef = oController[sNormalizedFactoryName];
          if (typeof fnRef === "function") {
            fnFactory = fnRef.bind(oController);
          }
        }

        if (!fnFactory) {
          fnFactory = this._internalFactory.bind(this);
        }

        oTable.bindAggregation("columns", {
          path: this.getColumnsPath(),
          sorter: { path: "COL_POS", descending: false },
          filters: [{ path: "TECH", operator: "NE", value1: "X" }],
          factory: fnFactory,
        });

        const oModel = this.getModel("Settings");
        const sEnablePath = this.getEnableEditionPath();
        const bEnableEdition = oModel?.getProperty(sEnablePath) === true;
        oTable.setSelectionMode(bEnableEdition ? "MultiToggle" : "None");

        oTable.destroyExtension();
        const oToolbar = new OverflowToolbar({
          style: "Clear",
          content: [
            new Title({ text: this.getTitleText() }),
            new ToolbarSpacer(),
            ...this._createEditButtons(),
          ],
        });
        oTable.addExtension(oToolbar);
      },

      getTable() {
        return this.getAggregation("_table");
      },

      _createEditButtons() {
        const fn = (eventName, icon, tooltip, visibleBinding) =>
          new Button({
            icon,
            tooltip,
            visible: visibleBinding,
            press: () => this.fireEvent(eventName),
          });

        return [
          fn(
            "pressSave",
            "sap-icon://save",
            "{main>/textPool/KX70}",
            "{Settings>/enableEdition}"
          ),
          fn(
            "pressCopy",
            "sap-icon://copy",
            "{main>/textPool/KX68}",
            "{Settings>/enableEdition}"
          ),
          fn(
            "pressDelete",
            "sap-icon://delete",
            "{main>/textPool/KX30}",
            "{Settings>/enableEdition}"
          ),
          fn(
            "pressAdd",
            "sap-icon://add",
            "{main>/textPool/KX69}",
            "{Settings>/enableEdition}"
          ),
          fn(
            "pressCancel",
            "sap-icon://decline",
            "{main>/textPool/KX32}",
            "{Settings>/enableEdition}"
          ),
          fn(
            "pressEdit",
            "sap-icon://edit",
            "{main>/textPool/K071}",
            "{= !${Settings>/enableEdition} }"
          ),
        ];
      },

      _internalFactory(sId, oContext) {
        const context = oContext.getObject();
        const sFieldname = context.FIELDNAME;
        const sDomName = context.DOMNAME;
        const sIntType = context.INTTYPE;
        const isEdit = context.EDIT;
        const path = `Settings>${sFieldname}`;

        const template = new VBox({
          items: [
            new Text({
              visible: "{= !%{Settings>/enableEdition} }",
              text: `{${path}}`,
              wrapping: true,
            }),
            new Input({
              value: `{${path}}`,
              name: sFieldname,
              visible: "{Settings>/enableEdition}",
              editable: {
                parts: ["Settings>CREATED"],
                formatter(isCreated) {
                  if (isCreated) {
                    return context.TECH_COMP !== "X";
                  }
                  return isEdit === "X";
                },
              },
              customData: [
                new CustomData({ key: "domName", value: sDomName }),
                new CustomData({ key: "lowercase", value: context.LOWERCASE }),
              ],
            }),
          ],
        });

        return new Column({
          id: sId,
          label: new Label({
            text: "{Settings>SCRTEXT_L}",
            tooltip: "{Settings>SCRTEXT_L}",
            wrapping: true,
            wrappingType: "Hyphenated",
          }),
          autoResizable: true,
          filterProperty: sFieldname,
          hAlign: sIntType === "P" ? "End" : "Left",
          name: sFieldname,
          showFilterMenuEntry: false,
          showSortMenuEntry: false,
          sortProperty: sFieldname,
          template,
          visible:
            "{= %{Settings>TECH} !== 'X' && %{Settings>NO_OUT} !== 'X' }",
          width: "auto",
        });
      },

      renderer(oRm, oControl) {
        oRm.openStart("div", oControl);
        oRm.class("innovaSimpleTableWrapper");
        oRm.openEnd();
        oRm.renderControl(oControl.getAggregation("_table"));
        oRm.close("div");
      },
    });
  }
);
