/**
	Section: GUI
*/
module Game {
    "use strict";

	/********************************************************************************
	 * Group: status panel
	 ********************************************************************************/
    export class Message implements Persistent {
        className: string;
        private _color: Core.Color;
        private _text: string;
        constructor(_color: Core.Color, _text: string) {
            this.className = "Message";
            this._color = _color;
            this._text = _text;
        }

        get text() { return this._text; }
        get color() { return this._color; }
        darkenColor() {
            this._color = Core.ColorUtils.multiply(this._color, Constants.LOG_DARKEN_COEF);
        }
    }

    export class StatusPanel extends Gizmo.ConsoleWidget implements Umbra.EventListener, Persistent {
        private static MESSAGE_X = Constants.STAT_BAR_WIDTH + 2;
        className: string;
        private messageHeight: number;
        private messages: Message[] = [];
        private mouseLookText: string = "";
        constructor(width: number, height: number) {
            super(width, height);
            this.moveTo(0, Constants.CONSOLE_HEIGHT - height);
            this.className = "StatusPanel";
            this.messageHeight = height - 1;
            Umbra.EventManager.registerEventListener(this, EventType[EventType.LOG_MESSAGE]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.NEW_GAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.LOAD_GAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.SAVE_GAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.DELETE_SAVEGAME]);
        }

        onLogMessage(msg: Message) {
            let lines = msg.text.split("\n");
            if (this.messages.length + lines.length > this.messageHeight) {
                this.messages.splice(0, this.messages.length + lines.length - this.messageHeight);
            }
            for (let i: number = 0; i < this.messages.length; ++i) {
                this.messages[i].darkenColor();
            }
            for (let j: number = 0; j < lines.length; ++j) {
                this.messages.push(new Message(msg.color, lines[j]));
            }
        }

        onNewGame() {
            this.clear();
        }

        onLoadGame() {
            Engine.instance.persister.loadFromKey(Constants.PERSISTENCE_STATUS_PANEL, this);
        }

        onSaveGame() {
            Engine.instance.persister.saveToKey(Constants.PERSISTENCE_STATUS_PANEL, this);
        }

        onDeleteSavegame() {
            Engine.instance.persister.deleteKey(Constants.PERSISTENCE_STATUS_PANEL);
        }

        onUpdate(time: number) {
            if (!Engine.instance.topologyMap) {
                // map not yet created (during newLevel phase)
                return;
            }
            let mousePos: Core.Position = Umbra.Input.getMouseCellPosition();
            if (Engine.instance.map.contains(mousePos.x, mousePos.y) && Engine.instance.map.isExplored(mousePos.x, mousePos.y)) {
                let actorsOnCell: Actor[] = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                    return actor.x === mousePos.x && actor.y === mousePos.y;
                });
                this.handleMouseLook(actorsOnCell, mousePos);
            }
        }

        onRender(destination: Yendor.Console) {
            this.console.clearBack(0x000000);
            this.console.clearText();
            let player: Player = Engine.instance.actorManager.getPlayer();
            this.console.print(0, 0, this.mouseLookText);
            this.renderBar(1, 1, Constants.STAT_BAR_WIDTH, "HP", player.destructible.hp,
                player.destructible.maxHp, Constants.HEALTH_BAR_BACKGROUND, Constants.HEALTH_BAR_FOREGROUND);
            this.renderBar(1, 2, Constants.STAT_BAR_WIDTH, "XP(" + player.xpHolder.xpLevel + ")", player.xpHolder.xp,
                player.xpHolder.getNextLevelXp(), Constants.XP_BAR_BACKGROUND, Constants.XP_BAR_FOREGROUND);
            this.renderConditions(player.ai.conditions);
            this.renderMessages();
            super.onRender(destination);
        }

        clear() {
            this.messages = [];
            this.mouseLookText = "";
        }

        private renderConditions(conditions: Condition[]) {
            if (!conditions) {
                return;
            }
            for (let i: number = 0, len: number = conditions.length; i < len && i < 4; ++i) {
                let cond: Condition = conditions[i];
                this.renderBar(1, 3 + i, Constants.STAT_BAR_WIDTH, cond.getName(),
                    cond.time, cond.initialTime, Constants.CONDITION_BAR_BACKGROUND,
                    Constants.CONDITION_BAR_FOREGROUND, false);
            }
        }

        private handleMouseLook(actors: Actor[], pos: Core.Position) {
            let len: number = actors.length;
            this.mouseLookText = "";
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                this.mouseLookText = "topo:" + Engine.instance.topologyMap.getObjectId(pos) + "|";
            }
            let player: Actor = Engine.instance.actorManager.getPlayer();
            let detectLifeCond: DetectLifeCondition = <DetectLifeCondition>player.ai.getCondition(ConditionType.DETECT_LIFE);
            let detectRange = detectLifeCond ? detectLifeCond.range : 0;
            for (let i: number = 0; i < len; ++i) {
                let actor: Actor = actors[i];
                if (!actor.isInContainer() && Engine.instance.mapRenderer.getActorRenderMode(actor, detectRange) !== ActorRenderMode.NONE) {
                    if (i > 0) {
                        this.mouseLookText += ",";
                    }
                    this.mouseLookText += Engine.instance.mapRenderer.canIdentifyActor(actor) ? actor.getDescription() : "?" ;
                }
            }
        }

        private renderMessages() {
            for (let i: number = 0; i < this.messages.length; ++i) {
                let msg: Message = this.messages[i];
                this.console.print(StatusPanel.MESSAGE_X, i + 1, msg.text, msg.color);
            }
        }

        private renderBar(x: number, y: number, width: number, name: string, value: number,
            maxValue: number, foreColor: Core.Color, backColor: Core.Color, displayValues: boolean = true) {
            this.console.clearBack(backColor, x, y, width, 1);
            let barWidth = Math.floor(value / maxValue * width);
            if (barWidth > 0) {
                this.console.clearBack(foreColor, x, y, barWidth, 1);
            }
            let label: string = name;
            if (displayValues && maxValue !== -1) {
                label += " : " + Math.floor(value) + "/" + Math.floor(maxValue);
            }
            this.console.print(x + Math.floor((width - label.length) / 2), y, label);
        }
    }
}
