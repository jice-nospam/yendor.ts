/// <reference path="../yendor/yendor.ts" />

module Game {
	/********************************************************************************
	 * Group: generic GUI stuff
	 ********************************************************************************/
	export class Gui extends Yendor.Position {
		private _pos: Yendor.Position = new Yendor.Position();
		private _console: Yendor.Console;
		private _visible: boolean = false;

		constructor(private _width: number, private _height: number) {
			super();
			this._console = new Yendor.Console(_width, _height );
		}

		get width() { return this._width; }
		get height() { return this._height; }

		isVisible() {return this._visible; }
		set visible(newValue: boolean) { this._visible = newValue; }
		show() { this._visible = true; }
		hide() { this._visible = false; }

		get console() { return this._console; }

		/*
			Function: render
			To be overloaded by extending classes.
		*/
		render(map: Map, actorManager: ActorManager, destination: Yendor.Console) {
			this._console.blit(destination, this.x, this.y);
		}
	}

	export interface GuiManager {
		addGui(gui: Gui, name: string, x: number, y: number);
		renderGui(rootConsole: Yendor.Console);
	}

	/********************************************************************************
	 * Group: status panel
	 ********************************************************************************/
	export class Message {
		constructor(private _color: Yendor.Color, private _text: string) {}

		get text() { return this._text; }
		get color() { return this._color; }
		darkenColor() {
			this._color = Yendor.ColorUtils.multiply(this._color, Constants.LOG_DARKEN_COEF);
		}
	}

	export class StatusPanel extends Gui implements EventListener {
		private static MESSAGE_X = Constants.STAT_BAR_WIDTH + 2;
		private messageHeight : number;
		private messages: Message[] = [];
		private mouseLookText: string = "";
		constructor(width: number, height: number) {
			super(width, height);
			this.messageHeight = height - 1;
			EventBus.getInstance().registerListener(this, EventType.LOG_MESSAGE);
			EventBus.getInstance().registerListener(this, EventType.MOUSE_MOVE);
		}

		processEvent( event: Event<any> ) {
			switch ( event.type ) {
				case EventType.LOG_MESSAGE :
					var msg: Message = event.data;
					this.message( msg.color, msg.text );
				break;
				case EventType.MOUSE_MOVE :
					var pos: Yendor.Position = event.data;
					if ( event.map.isInFov(pos.x, pos.y) ) {
						var actorsOnCell: Actor[] = event.actorManager.findActorsOnCell(pos, event.actorManager.getCreatures());
						actorsOnCell = actorsOnCell.concat(event.actorManager.findActorsOnCell(pos, event.actorManager.getItems()));
						actorsOnCell = actorsOnCell.concat(event.actorManager.findActorsOnCell(pos, event.actorManager.getCorpses()));
						this.handleMouseLook( actorsOnCell );
					}
				break;
			}
		}

		message(color: Yendor.Color, text: string) {
			var lines = text.split("\n");
			if ( this.messages.length + lines.length > this.messageHeight ) {
				this.messages.splice(0, this.messages.length + lines.length - this.messageHeight );
			}
			for ( var i: number = 0; i < this.messages.length; ++i ) {
				this.messages[i].darkenColor();
			}
			for ( var j: number = 0; j < lines.length; ++j ) {
				this.messages.push(new Message(color, lines[j]));
			}
		}

		private handleMouseLook( actors: Actor[] ) {
			var len: number = actors.length;
			this.mouseLookText = len === 0 ? "" : actors[0].name;
			for ( var i: number = 1; i < len; ++i) {
				var actor: Actor = actors[i];
				this.mouseLookText += "," + actor.name;
			}
		}

		private renderMessages() {
			for ( var i: number = 0; i < this.messages.length; ++i ) {
				var msg: Message = this.messages[i];
				this.console.print(StatusPanel.MESSAGE_X, i + 1, msg.text, msg.color);
			}
		}

		render(map: Map, actorManager: ActorManager, destination: Yendor.Console) {
			this.console.clearBack("black");
			this.console.clearText();
			var player: Actor = actorManager.getPlayer();
			this.renderBar(1, 1, Constants.STAT_BAR_WIDTH, "HP", player.destructible.hp,
				player.destructible.maxHp, Constants.HEALTH_BAR_BACKGROUND, Constants.HEALTH_BAR_FOREGROUND);
			this.console.print(0, 0, this.mouseLookText);
			this.renderMessages();
			super.render(map, actorManager, destination);
		}

		private renderBar(x: number, y: number, width: number, name: string, value: number,
			maxValue: number, foreColor: Yendor.Color, backColor: Yendor.Color) {
			this.console.clearBack(backColor, x, y, width, 1);
			var barWidth = Math.floor(value / maxValue * width);
			if ( barWidth > 0 ) {
				this.console.clearBack(foreColor, x, y, barWidth, 1);
			}
			var label: string = name + " : " + value + "/" + maxValue;
			this.console.print(x + ((width - label.length) >> 1), y, label);
		}
	}

	/********************************************************************************
	 * Group: inventory
	 ********************************************************************************/
	export class InventoryPanel extends Gui implements EventListener {
		static TITLE: string = "=== inventory - ESC to close ===";
		constructor(width: number, height: number, private actor: Actor) {
			super(width, height);
			EventBus.getInstance().registerListener(this, EventType.KEY_PRESSED);
		}

		processEvent( event: Event<any> ) {
			if ( ! this.isVisible() && event.data.key === "i" ) {
				this.show();
			} else if (this.isVisible()) {
				if ( event.data.keyCode === KeyEvent.DOM_VK_ESCAPE ) {
					this.hide();
				} else {
					var index = event.data.key.charCodeAt(0) - "a".charCodeAt(0);
					if ( index >= 0 && index < this.actor.container.size() ) {
						var item: Actor = this.actor.container.get(index);
						if (item.pickable) {
							this.hide();
							item.pickable.use(item, this.actor, event.actorManager);
						}
					}
				}
			}
		}

		render(map: Map, actorManager: ActorManager, destination: Yendor.Console) {
			this.console.clearBack("maroon");
			this.console.clearText();
			var shortcut: number = "a".charCodeAt(0);
			var y: number = 1;
			this.console.print(Math.floor(this.width / 2 - InventoryPanel.TITLE.length / 2), 0, InventoryPanel.TITLE);
			for ( var i: number = 0; i < this.actor.container.size(); ++i) {
				var item: Actor = this.actor.container.get(i);
				this.console.print(2, y, "(" + String.fromCharCode(shortcut) + ") " + item.name);
				y++;
				shortcut++;
			}
			super.render(map, actorManager, destination);
		}
	}


	/********************************************************************************
	 * Group: tilePicker
	 ********************************************************************************/

	export interface TilePickerListener {
		(pos: Yendor.Position): void;
	}

	/*
		Class: TilePicker
		A background Gui that sleeps until it receives a PICK_TILE event containing a TilePickerListener.
		It then listens to mouse move events until the player left-clicks a tile.
		Then it calls the TilePickerListener with the selected tile position.
	*/
	export class TilePicker extends Gui implements EventListener {
		private tilePos : Yendor.Position;
		private listener: TilePickerListener;
		private tileIsValid: boolean = false;
		private map: Map;
		constructor(map: Map) {
			super(Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT);
			this.map = map;
			EventBus.getInstance().registerListener(this, EventType.PICK_TILE);
		}

		processEvent( event: Event<any> ) {
			if (!this.isVisible() && event.type === EventType.PICK_TILE ) {
				this.listener = event.data;
				EventBus.getInstance().registerListener(this, EventType.MOUSE_MOVE);
				EventBus.getInstance().registerListener(this, EventType.MOUSE_CLICK);
				this.show();
				this.tileIsValid = false;
			} else if (this.isVisible() && event.type === EventType.MOUSE_MOVE) {
				this.tilePos = event.data;
				this.tileIsValid = this.map.isInFov(this.tilePos.x, this.tilePos.y);
			} else if (this.isVisible() && event.type === EventType.MOUSE_CLICK) {
				if ( event.data === MouseButton.LEFT ) {
					if (! this.tileIsValid ) {
						return;
					} else if (this.listener) {
						this.listener(this.tilePos);
					}
				}
				EventBus.getInstance().unregisterListener(this, EventType.MOUSE_MOVE);
				EventBus.getInstance().unregisterListener(this, EventType.MOUSE_CLICK);
				this.hide();
			}
		}

		render(map: Map, actorManager: ActorManager, console: Yendor.Console) {
			console.setChar( this.tilePos.x, this.tilePos.y, this.tileIsValid ? "+" : "x" );
			console.fore[this.tilePos.x][this.tilePos.y] = this.tileIsValid ? "green" : "red";
		}
	}
}
