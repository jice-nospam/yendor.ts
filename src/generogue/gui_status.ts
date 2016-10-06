/**
 * Section: GUI
 */
import * as Core from "../fwk/core/main";
import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";
import * as Actors from "../fwk/actors/main";
import * as Map from "../fwk/map/main";
import * as Constants from "./base";

/**
 * =============================================================================
 * Group: status panel
 * =============================================================================
 */
export class Message {
    private _color: Core.Color;
    private _text: string;
    constructor( _color: Core.Color,
                 _text: string
    ) {
        this._color = _color;
        this._text = _text;
    }

    get text() { return this._text; }
    get color() { return this._color; }
    public darkenColor() {
        this._color = Core.ColorUtils.multiply(this._color, Constants.LOG_DARKEN_COEF);
    }
}

export class StatusPanel extends Gui.ConsoleWidget implements Umbra.IEventListener {
    private static MESSAGE_X = Constants.STAT_BAR_WIDTH + 2;
    private messageHeight: number;
    private messages: Message[] = [];
    private mouseLookText: string = "";

    public init( width: number,
                 height: number
    ) {
        super.init(width, height);
        this.moveToBottomLeft();
        this.messageHeight = height - 1;
        Umbra.EventManager.registerEventListener(this, Umbra.EVENT_LOG);
    }

    public onTerm() {
        super.onTerm();
        Umbra.EventManager.registerEventListener(this, Umbra.EVENT_LOG);
    }

    public onLog( event: Umbra.ILogEvent
    ) {
        if ( event.level === Umbra.LogLevel.DEBUG ) {
            return;
        }
        let lines = event.text.split("\n");
        if (this.messages.length + lines.length > this.messageHeight) {
            this.messages.splice(0, this.messages.length + lines.length - this.messageHeight);
        }
        for (let msg of this.messages) {
            msg.darkenColor();
        }
        let col: Core.Color;
        switch (event.level) {
            default:
            case Umbra.LogLevel.INFO : col = Constants.LOG_INFO_COLOR; break;
            case Umbra.LogLevel.WARN : col = Constants.LOG_WARN_COLOR; break;
            case Umbra.LogLevel.ERROR : col = Constants.LOG_CRIT_COLOR; break;
            case Umbra.LogLevel.CRITICAL : col = Constants.LOG_CRIT_COLOR; break;
        }
        for (let line of lines) {
            this.messages.push(new Message(col, line));
        }
    }

    public onUpdate( _time: number
    ) {
        if (!Map.Map.current) {
            // map not yet created (during newLevel phase)
            return;
        }
        let mousePos: Core.Position = Umbra.getMouseCellPosition();
        if (Map.Map.current.contains(mousePos.x, mousePos.y) && Map.Map.current.isExplored(mousePos.x, mousePos.y)) {
            let actorsOnCell: Actors.Actor[] = Actors.Actor.list.filter(
                (actor: Actors.Actor) => actor.pos.equals(mousePos)
            );
            this.handleMouseLook(actorsOnCell, mousePos);
        }
    }

    public onRender( destination: Yendor.Console
    ) {
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        if ( player === undefined ) {
            return;
        }
        this.console.clearBack(0x000000);
        this.console.clearText();
        this.console.print(0, 0, this.mouseLookText);
        this.renderBar(1, 1, Constants.STAT_BAR_WIDTH, "HP", player.destructible.hp,
            player.destructible.maxHp, Constants.HEALTH_BAR_BACKGROUND, Constants.HEALTH_BAR_FOREGROUND);
        this.renderBar(1, 2, Constants.STAT_BAR_WIDTH, "XP(" + player.xpHolder.xpLevel + ")", player.xpHolder.xp,
            player.xpHolder.getNextLevelXp(), Constants.XP_BAR_BACKGROUND, Constants.XP_BAR_FOREGROUND);
        this.renderConditions(player.ai.conditions);
        this.renderMessages();
        super.onRender(destination);
    }

    public clear() {
        this.messages = [];
        this.mouseLookText = "";
    }

    private renderConditions( conditions: Actors.Condition[]
    ) {
        if (!conditions) {
            return;
        }
        for (let i: number = 0, len: number = conditions.length; i < len && i < 4; ++i) {
            let cond: Actors.Condition = conditions[i];
            this.renderBar(1, 3 + i, Constants.STAT_BAR_WIDTH, cond.getName(),
                cond.time, cond.initialTime, Constants.CONDITION_BAR_BACKGROUND,
                Constants.CONDITION_BAR_FOREGROUND, false);
        }
    }

    private handleMouseLook( actors: Actors.Actor[],
                             _pos: Core.Position
    ) {
        let len: number = actors.length;
        this.mouseLookText = "";
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        if ( player ) {
            let detectLifeCond: Actors.DetectLifeCondition =
                <Actors.DetectLifeCondition> player.ai.getCondition(Actors.ConditionTypeEnum.DETECT_LIFE);
            let detectRange = detectLifeCond ? detectLifeCond.range : 0;
            for (let i: number = 0; i < len; ++i) {
                let actor: Actors.Actor = actors[i];
                if (!actor.isInContainer()
                    && Map.Map.current.renderer.getActorRenderMode(actor, detectRange)
                    !== Map.ActorRenderModeEnum.NONE) {
                    if (i > 0) {
                        this.mouseLookText += ",";
                    }
                    this.mouseLookText += Map.Map.current.renderer.canIdentifyActor(actor)
                        ? actor.getDescription() : "?" ;
                }
            }
        }
    }

    private renderMessages() {
        for (let i: number = 0; i < this.messages.length; ++i) {
            let msg: Message = this.messages[i];
            this.console.print(StatusPanel.MESSAGE_X, i + 1, msg.text, msg.color);
        }
    }

    private renderBar( x: number,
                       y: number,
                       width: number,
                       name: string|undefined,
                       value: number,
                       maxValue: number,
                       foreColor: Core.Color,
                       backColor: Core.Color,
                       displayValues: boolean = true
    ) {
        this.console.clearBack(backColor, x, y, width, 1);
        let barWidth = Math.floor(value / maxValue * width);
        if (barWidth > 0) {
            this.console.clearBack(foreColor, x, y, barWidth, 1);
        }
        let label: string = name || "";
        if (displayValues && maxValue !== -1) {
            if (name) {
                label += " : ";
            }
            label += Math.floor(value) + "/" + Math.floor(maxValue);
        }
        this.console.print(x + Math.floor((width - label.length) / 2), y, label);
    }
}
