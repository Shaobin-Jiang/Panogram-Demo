/**
 * The main class of the Pedigree Editor, responsible for initializing all the basic elements of the app.
 * Contains wrapper methods for the most commonly used functions.
 * This class should be initialized only once.
 *
 * @class PedigreeEditor
 * @constructor
 */
var PedigreeEditor = Class.create({
    initialize: function() {
        //this.DEBUG_MODE = true;
        window.editor = this;

        // initialize main data structure which holds the graph structure
        this._graphModel = DynamicPositionedGraph.makeEmpty(PedigreeEditor.attributes.layoutRelativePersonWidth, PedigreeEditor.attributes.layoutRelativeOtherWidth);

        //initialize the elements of the app
        this._workspace = new Workspace();
        this._nodeMenu = this.generateNodeMenu();
        this._nodeGroupMenu = this.generateNodeGroupMenu();
        this._partnershipMenu = this.generatePartnershipMenu();
        this._nodetypeSelectionBubble = new NodetypeSelectionBubble(false);
        this._siblingSelectionBubble  = new NodetypeSelectionBubble(true);
        this._okCancelDialogue = new OkCancelDialogue();
        this._disorderLegend = new DisorgerLegend();
        this._geneLegend = new GeneLegend();
        this._hpoLegend = new HPOLegend();

        this._view = new View();

        this._actionStack = new ActionStack();
        this._templateSelector = new TemplateSelector();
        this._importSelector = new ImportSelector();
        this._exportSelector = new ExportSelector();
        this._saveLoadIndicator = new SaveLoadIndicator();
        this._versionUpdater = new VersionUpdater();
        this._saveLoadEngine = new SaveLoadEngine();
        this._probandData = new ProbandDataLoader();

        // load proband data and load the graph after proband data is available
        this._probandData.load( this._saveLoadEngine.load.bind(this._saveLoadEngine) );

        this._controller = new Controller();

        //attach actions to buttons on the top bar
        var undoButton = $('action-undo');
        undoButton && undoButton.on("click", function(event) {
            document.fire("pedigree:undo");
        });
        var redoButton = $('action-redo');
        redoButton && redoButton.on("click", function(event) {
            document.fire("pedigree:redo");
        });

        var autolayoutButton = $('action-layout');
        autolayoutButton && autolayoutButton.on("click", function(event) {
            document.fire("pedigree:autolayout");
        });
        var clearButton = $('action-clear');
        clearButton && clearButton.on("click", function(event) {
            document.fire("pedigree:graph:clear");
        });

        var saveButton = $('action-save');
        saveButton && saveButton.on("click", function(event) {
            editor.getView().unmarkAll();
            editor.getSaveLoadEngine().save();
        });
        var loadButton = $('action-reload');
        loadButton && loadButton.on("click", function(event) {
            editor.getSaveLoadEngine().load();
        });

        var templatesButton = $('action-templates');
        templatesButton && templatesButton.on("click", function(event) {
            editor.getTemplateSelector().show();
        });
        var importButton = $('action-import');
        importButton && importButton.on("click", function(event) {
            editor.getImportSelector().show();
        });
        var exportButton = $('action-export');
        exportButton && exportButton.on("click", function(event) {
            editor.getExportSelector().show();
        });

        var closeButton = $('action-close');
        closeButton && closeButton.on("click", function(event) {
            //editor.getSaveLoadEngine().save();
            window.location=XWiki.currentDocument.getURL('edit');
        });

        var renumberButton = $('action-number');
        renumberButton && renumberButton.on("click", function(event) {
            document.fire("pedigree:renumber");
        });

        var unsupportedBrowserButton = $('action-readonlymessage');
        unsupportedBrowserButton && unsupportedBrowserButton.on("click", function(event) {
            alert("Your browser does not support all the features required for " +
                  "Pedigree Editor, so pedigree is displayed in read-only mode (and may have quirks).\n\n" +
                  "Supported browsers include Firefox v3.5+, Internet Explorer v9+, " +
                  "Chrome, Safari v4+, Opera v10.5+ and most mobile browsers.");
        });

        //this.startAutoSave(30);
    },

    /**
     * Returns the graph node with the corresponding nodeID
     * @method getNode
     * @param {Number} nodeID The id of the desired node
     * @return {AbstractNode} the node whose id is nodeID
     */
    getNode: function(nodeID) {
        return this.getView().getNode(nodeID);
    },

    /**
     * @method getView
     * @return {View} (responsible for managing graphical representations of nodes and interactive elements)
     */
    getView: function() {
        return this._view;
    },

    /**
     * @method getVersionUpdater
     * @return {VersionUpdater}
     */
    getVersionUpdater: function() {
        return this._versionUpdater;
    },

    /**
     * @method getGraph
     * @return {DynamicPositionedGraph} (data model: responsible for managing nodes and their positions)
     */
    getGraph: function() {
        return this._graphModel;
    },

    /**
     * @method getController
     * @return {Controller} (responsible for managing user input and corresponding data changes)
     */
    getController: function() {
        return this._controller;
    },

    /**
     * @method getActionStack
     * @return {ActionStack} (responsible for undoing and redoing actions)
     */
    getActionStack: function() {
        return this._actionStack;
    },

    /**
     * @method getOkCancelDialogue
     * @return {OkCancelDialogue} (responsible for displaying ok/cancel prompts)
     */
    getOkCancelDialogue: function() {
        return this._okCancelDialogue;
    },

    /**
     * @method getNodetypeSelectionBubble
     * @return {NodetypeSelectionBubble} (floating window with initialization options for new nodes)
     */
    getNodetypeSelectionBubble: function() {
        return this._nodetypeSelectionBubble;
    },

    /**
     * @method getSiblingSelectionBubble
     * @return {NodetypeSelectionBubble} (floating window with initialization options for new sibling nodes)
     */
    getSiblingSelectionBubble: function() {
        return this._siblingSelectionBubble;
    },

    /**
     * @method getWorkspace
     * @return {Workspace}
     */
    getWorkspace: function() {
        return this._workspace;
    },

    /**
     * @method getDisorderLegend
     * @return {Legend} Responsible for managing and displaying the disorder legend
     */
    getDisorderLegend: function() {
        return this._disorderLegend;
    },

    /**
     * @method getHPOLegend
     * @return {Legend} Responsible for managing and displaying the phenotype/HPO legend
     */
    getHPOLegend: function() {
        return this._hpoLegend;
    },

    /**
     * @method getGeneLegend
     * @return {Legend} Responsible for managing and displaying the candidate genes legend
     */
    getGeneLegend: function() {
        return this._geneLegend;
    },

    /**
     * @method getPaper
     * @return {Workspace.paper} Raphael paper element
     */
    getPaper: function() {
        return this.getWorkspace().getPaper();
    },

    /**
     * @method isReadOnlyMode
     * @return {Boolean} True iff pedigree drawn should be read only with no handles
     *                   (read-only mode is used for IE8 as well as for template display and
     *                   print and export versions).
     */
    isReadOnlyMode: function() {
        if (this.isUnsupportedBrowser()) return true;
        return false;
    },

    isUnsupportedBrowser: function() {
        // http://voormedia.com/blog/2012/10/displaying-and-detecting-support-for-svg-images
        if (!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
            // implies unpredictable behavior when using handles & interactive elements,
            // and most likely extremely slow on any CPU
            return true;
        }
        // http://kangax.github.io/es5-compat-table/
        if (!window.JSON) {
            // no built-in JSON parser - can't proceed in any way; note that this also implies
            // no support for some other functions such as parsing XML.
            //
            // TODO: include free third-party JSON parser and replace XML with JSON when loading data;
            //       (e.g. https://github.com/douglascrockford/JSON-js)
            //
            //       => at that point all browsers which suport SVG but are treated as unsupported
            //          should theoreticaly start working (FF 3.0, Safari 3 & Opera 9/10 - need to test).
            //          IE7 does not support SVG and JSON and is completely out of the running;
            alert("Your browser is not supported and is unable to load and display any pedigrees.\n\n" +
                  "Suported browsers include Internet Explorer version 9 and higher, Safari version 4 and higher, "+
                  "Firefox version 3.6 and higher, Opera version 10.5 and higher, any version of Chrome and most "+
                  "other modern browsers (including mobile). IE8 is able to display pedigrees in read-only mode.");
            window.stop && window.stop();
            return true;
        }
        return false;
    },

    /**
     * @method getSaveLoadEngine
     * @return {SaveLoadEngine} Engine responsible for saving and loading operations
     */
    getSaveLoadEngine: function() {
        return this._saveLoadEngine;
    },

    /**
     * @method getProbandDataFromPhenotips
     * @return {firstName: "...", lastName: "..."}
     */
    getProbandDataFromPhenotips: function() {
        return this._probandData.probandData;
    },

    /**
     * @method getTemplateSelector
     * @return {TemplateSelector}
     */
    getTemplateSelector: function() {
        return this._templateSelector
    },

    /**
     * @method getImportSelector
     * @return {ImportSelector}
     */
    getImportSelector: function() {
        return this._importSelector
    },

    /**
     * @method getExportSelector
     * @return {ExportSelector}
     */
    getExportSelector: function() {
        return this._exportSelector
    },

    /**
     * Returns true if any of the node menus are visible
     * (since some UI interactions should be disabled while menu is active - e.g. mouse wheel zoom)
     *
     * @method isAnyMenuVisible
     */
    isAnyMenuVisible: function() {
        if (this.getNodeMenu().isVisible() || this.getNodeGroupMenu().isVisible() || this.getPartnershipMenu().isVisible()) {
            return;
        }
    },

    /**
     * Creates the context menu for Person nodes
     *
     * @method generateNodeMenu
     * @return {NodeMenu}
     */
    generateNodeMenu: function() {
        if (this.isReadOnlyMode()) return null;
        var _this = this;
        return new NodeMenu([
            {
                'name' : 'identifier',
                'label' : '',
                'type'  : 'hidden',
                'tab': '个人信息'
            },
            {
                'name' : 'gender',
                'label' : '性别',
                'type' : 'radio',
                'tab': '个人信息',
                'columns': 3,
                'values' : [
                    { 'actual' : 'M', 'displayed' : '男性' },
                    { 'actual' : 'F', 'displayed' : '女性' },
                    { 'actual' : 'U', 'displayed' : '未知' }
                ],
                'default' : 'U',
                'function' : 'setGender'
            },
            {
                'name' : 'last_name',
                'label': '姓',
                'type' : 'text',
                'tab': '个人信息',
                'function' : 'setLastName'
            },
            {
                'name' : 'first_name',
                'label': '名',
                'type' : 'text',
                'tab': '个人信息',
                'function' : 'setFirstName'
            },
            {
                'name' : 'job',
                'label' : '职业',
                'type' : 'text',
                'tab' : '个人信息',
                'function' : 'setJob'
            },
            {
                'name' : 'education',
                'label' : '学历',
                'type' : 'text',
                'tab' : '个人信息',
                'function' : 'setEducation'
            },
            {
                'name' : 'external_id',
                'label': 'ID',
                'type' : 'text',
                'tab': '个人信息',
                'function' : 'setExternalID'
            },
            {
                'name' : 'date_of_birth',
                'label' : '出生日期',
                'type' : 'date-picker',
                'tab': '个人信息',
                'format' : 'yyyy/MM/dd',
                'function' : 'setBirthDate'
            },
            {
                'name' : 'date_of_death',
                'label' : '死亡日期',
                'type' : 'date-picker',
                'tab': '个人信息',
                'format' : 'yyyy/MM/dd',
                'function' : 'setDeathDate'
            },
            {
                'name' : 'gestation_age',
                'label' : '孕龄',
                'type' : 'select',
                'tab': '个人信息',
                'range' : {'start': 0, 'end': 50, 'item' : ['周', '周']},
                'nullValue' : true,
                'function' : 'setGestationAge'
            },
            {
                'name' : 'state',
                'label' : '状态',
                'type' : 'radio',
                'tab': '个人信息',
                'columns': 3,
                'values' : [
                    { 'actual' : 'alive', 'displayed' : '存活' },
                    { 'actual' : 'stillborn', 'displayed' : '流产' },
                    { 'actual' : 'deceased', 'displayed' : '死亡' },
                    { 'actual' : 'miscarriage', 'displayed' : '死胎' },
                    { 'actual' : 'unborn', 'displayed' : '未出生' },
                    { 'actual' : 'aborted', 'displayed' : '堕胎' }
                ],
                'default' : 'alive',
                'function' : 'setLifeStatus'
            },
            {
                'label' : '是否无子女',
                'name' : 'childlessSelect',
                'values' : [{'actual': 'none', displayed: '否'},{'actual': 'childless', displayed: '无子女'},{'actual': 'infertile', displayed: '不孕不育'}],
                'type' : 'select',
                'tab': '个人信息',
                'function' : 'setChildlessStatus'
            },
            {
                'name' : 'childlessText',
                'type' : 'text',
                'dependency' : 'childlessSelect != infertile',
                'tip' : '原因',
                'tab': '个人信息',
                'function' : 'setChildlessReason'
            },
            {
                'name' : 'adopted',
                'label' : '是否为收养',
                'type' : 'checkbox',
                'tab': '个人信息',
                'function' : 'setAdopted'
            },
            {
                'name' : 'monozygotic',
                'label' : '同卵双胞胎',
                'type' : 'checkbox',
                'tab': '个人信息',
                'function' : 'setMonozygotic'
            },
            {
                'name' : 'nocontact',
                'label' : '与先证者无关联',
                'type' : 'checkbox',
                'tab': '个人信息',
                'function' : 'setLostContact'
            },
            {
                'name' : 'placeholder',
                'label' : 'Placeholder node',
                'type' : 'checkbox',
                'tab': '个人信息',
                'function' : 'makePlaceholder'
            },
            {
                'name' : 'carrier',
                'label' : 'Carrier status',
                'type' : 'radio',
                'tab': '诊断信息',
                'values' : [
                    { 'actual' : '', 'displayed' : 'Not affected' },
                    { 'actual' : 'carrier', 'displayed' : 'Carrier' },
                    { 'actual' : 'affected', 'displayed' : 'Affected' },
                    { 'actual' : 'presymptomatic', 'displayed' : 'Pre-symptomatic' }
                ],
                'default' : '',
                'function' : 'setCarrierStatus'
            },
            {
                'name' : 'evaluated',
                'label' : 'Documented evaluation',
                'type' : 'checkbox',
                'tab': '诊断信息',
                'function' : 'setEvaluated'
            },
            {
                'name' : 'disorders',
                'label' : 'Known disorders of this individual',
                'type' : 'disease-picker',
                'tab': '诊断信息',
                'function' : 'setDisorders'
            },
            {
                'name' : 'hpo_positive',
                'label' : 'Clinical symptoms: observed phenotypes',
                'type' : 'hpo-picker',
                'tab': '诊断信息',
                'function' : 'setHPO'
            },
            {
                'name' : 'candidate_genes',
                'label' : 'Genotype information: candidate genes',
                'type' : 'gene-picker',
                'tab': '诊断信息',
                'function' : 'setGenes'
            },
            {
                'name' : 'comments',
                'label' : '备注',
                'type' : 'textarea',
                'tab': '诊断信息',
                'rows' : 2,
                'function' : 'setComments'
            }
        ], ["个人信息", "诊断信息"]);
    },

    /**
     * @method getNodeMenu
     * @return {NodeMenu} Context menu for nodes
     */
    getNodeMenu: function() {
        return this._nodeMenu;
    },

    /**
     * Creates the context menu for PersonGroup nodes
     *
     * @method generateNodeGroupMenu
     * @return {NodeMenu}
     */
    generateNodeGroupMenu: function() {
        if (this.isReadOnlyMode()) return null;
        var _this = this;
        return new NodeMenu([
            {
                'name' : 'identifier',
                'label' : '',
                'type'  : 'hidden'
            },
            {
                'name' : 'gender',
                'label' : '性别',
                'type' : 'radio',
                'columns': 3,
                'values' : [
                    { 'actual' : 'M', 'displayed' : '男性' },
                    { 'actual' : 'F', 'displayed' : '女性' },
                    { 'actual' : 'U', 'displayed' : '未知' }
                ],
                'default' : 'U',
                'function' : 'setGender'
            },
            {
                'name' : 'numInGroup',
                'label': '组内人数',
                'type' : 'select',
                'values' : [{'actual': 1, displayed: 'N'}, {'actual': 2, displayed: '2'}, {'actual': 3, displayed: '3'},
                            {'actual': 4, displayed: '4'}, {'actual': 5, displayed: '5'}, {'actual': 6, displayed: '6'},
                            {'actual': 7, displayed: '7'}, {'actual': 8, displayed: '8'}, {'actual': 9, displayed: '9'}],
                'function' : 'setNumPersons'
            },
            {
                'name' : 'external_ids',
                'label': 'ID',
                'type' : 'text',
                'function' : 'setExternalID'
            },
            {
                'name' : 'disorders',
                'label' : '障碍<br>(组内成员共有的)',
                'type' : 'disease-picker',
                'function' : 'setDisorders'
            },
            {
                'name' : 'comments',
                'label' : '备注',
                'type' : 'textarea',
                'rows' : 2,
                'function' : 'setComments'
            },
            {
                'name' : 'state',
                'label' : '组内成员均为',
                'type' : 'radio',
                'values' : [
                    { 'actual' : 'alive', 'displayed' : '存活' },
                    { 'actual' : 'aborted', 'displayed' : '堕胎' },
                    { 'actual' : 'deceased', 'displayed' : '死亡' },
                    { 'actual' : 'miscarriage', 'displayed' : '流产' }
                ],
                'default' : 'alive',
                'function' : 'setLifeStatus'
            },
            {
                'name' : 'evaluatedGrp',
                'label' : 'Documented evaluation',
                'type' : 'checkbox',
                'function' : 'setEvaluated'
            },
            {
                'name' : 'adopted',
                'label' : '是否为收养',
                'type' : 'checkbox',
                'function' : 'setAdopted'
            }
        ], []);
    },

    /**
     * @method getNodeGroupMenu
     * @return {NodeMenu} Context menu for nodes
     */
    getNodeGroupMenu: function() {
        return this._nodeGroupMenu;
    },

    /**
     * Creates the context menu for Partnership nodes
     *
     * @method generatePartnershipMenu
     * @return {NodeMenu}
     */
    generatePartnershipMenu: function() {
        if (this.isReadOnlyMode()) return null;
        var _this = this;
        return new NodeMenu([
            {
                'label' : 'Heredity options',
                'name' : 'childlessSelect',
                'values' : [{'actual': 'none', displayed: 'None'},{'actual': 'childless', displayed: 'Childless'},{'actual': 'infertile', displayed: 'Infertile'}],
                'type' : 'select',
                'function' : 'setChildlessStatus'
            },
            {
                'name' : 'childlessText',
                'type' : 'text',
                'dependency' : 'childlessSelect != none',
                'tip' : 'Reason',
                'function' : 'setChildlessReason'
            },
            {
                'name' : 'consangr',
                'label' : '亲密程度',
                'type' : 'radio',
                'values' : [
                    { 'actual' : 'A', 'displayed' : '默认' },
                    { 'actual' : 'Y', 'displayed' : '亲近' },
                    { 'actual' : 'N', 'displayed' : '疏远' }
                ],
                'default' : 'A',
                'function' : 'setConsanguinity'
            },
            {
                'name' : 'broken',
                'label' : '离婚',
                'type' : 'checkbox',
                'function' : 'setBrokenStatus'
            }
        ], [], "relationship-menu");
    },

    /**
     * @method getPartnershipMenu
     * @return {NodeMenu} The context menu for Partnership nodes
     */
    getPartnershipMenu: function() {
        return this._partnershipMenu;
    },

    /**
     * @method convertGraphCoordToCanvasCoord
     * @return [x,y] coordinates on the canvas
     */
    convertGraphCoordToCanvasCoord: function(x, y) {
        var scale = PedigreeEditor.attributes.layoutScale;
        return { x: x * scale.xscale,
                 y: y * scale.yscale };
    },

    /**
     * Starts a timer to save the application state every 30 seconds
     *
     * @method initializeSave
     */
    startAutoSave: function(intervalInSeconds) {
        setInterval(function(){editor.getSaveLoadEngine().save()}, intervalInSeconds*1000);
    }
});

var editor;

//attributes for graphical elements in the editor
PedigreeEditor.attributes = {
    propagateLastName: true,   // when true, father's last name is propagated as "last name at birth" to descendants
    radius: 40,
    orbRadius: 6,
    touchOrbRadius: 8,
    personHoverBoxRadius: 90,  // 80    for old handles, 90 for new
    newHandles: true,          // false for old handles
    personHandleLength: 75,    // 60    for old handles, 75 for new
    personHandleBreakX: 55,
    personHandleBreakY: 53,
    personSiblingHandleLengthX: 65,
    personSiblingHandleLengthY: 30,
    enableHandleHintImages: true,
    handleStrokeWidth: 5,
    groupNodesScale: 0.85,
    childlessLength: 14,
    infertileMarkerHeight: 4,
    infertileMarkerWidth: 14,
    twinCommonVerticalLength: 6,
    twinMonozygothicLineShiftY: 24,
    curvedLinesCornerRadius: 25,
    unbornShape: {'font-size': 50, 'font-family': 'Cambria'},
    carrierShape: {fill : '#595959'},
    carrierDotRadius: 8,
    presymptomaticShape: {fill : '#777777', "stroke": "#777777"},
    presymptomaticShapeWidth: 8,
    evaluationShape: {'font-size': 40, 'font-family': 'Arial'},
    nodeShape:     {fill: "#DDDDDD", stroke: "#595959"},  // this
    nodeShapeMenuOn:  {fill: "#000", stroke: "none", "fill-opacity": 0.1},
    nodeShapeMenuOff: {fill: "#000", stroke: "none", "fill-opacity": 0},
    nodeShapeMenuOnPartner:  {fill: "#000", stroke: "none", "fill-opacity": 0.1},
    nodeShapeMenuOffPartner: {fill: "#000", stroke: "none",   "fill-opacity": 0},
    nodeShapeDiag: {fill: "#DDDDDD", stroke: "#595959"}, // this
    boxOnHover : {fill: "gray", stroke: "none", opacity: 1, "fill-opacity":.35},
    menuBtnIcon : {fill: "#1F1F1F", stroke: "none"},
    deleteBtnIcon : {fill: "#990000", stroke: "none"},
    btnMaskHoverOn : {opacity:.6, stroke: 'none'},
    btnMaskHoverOff : {opacity:0},
    btnMaskClick: {opacity:1},
    orbHue : .53,
        phShape: {fill: "white","fill-opacity": 0, "stroke": 'black', "stroke-dasharray": "- "},
    dragMeLabel: {'font-size': 14, 'font-family': 'Tahoma'},
    pedNumberLabel: {'font-size': 19, 'font-family': 'Serif'},
    descendantGroupLabel: {'font-size': 21, 'font-family': 'Tahoma'},
    label: {'font-size': 20, 'font-family': 'Arial'},
    nameLabels: {'font-size': 20, 'font-family': 'Arial'},
    commentLabel: {'font-size': 19, 'font-family': 'Arial' },
    externalIDLabels: {'font-size': 18, 'font-family': 'Arial' },
    disorderShapes: {},
    partnershipNode: {fill: '#dc7868', stroke: 'black', 'stroke-width':2},  //#E25740
    partnershipRadius: 6.5,
    partnershipHandleBreakY: 15,
    partnershipHandleLength: 36,
    partnershipLines :         {"stroke-width": 1.25, stroke : '#303058'},
    consangrPartnershipLines : {"stroke-width": 1.25, stroke : '#402058'},
    noContactLines:            {"stroke-width": 1.75, stroke : '#333333', "stroke-dasharray": "."},
    notInContactLineSize: 20,
    graphToCanvasScale: 12,
    layoutRelativePersonWidth: 10,
    layoutRelativeOtherWidth: 2,
    layoutScale: { xscale: 12.0, yscale: 8 }
};

document.observe("xwiki:dom:loaded",function() {
    editor = new PedigreeEditor();
});
