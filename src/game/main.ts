/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../yendor/yendor.ts" />
/// <reference path="base.ts" />
/// <reference path="eventbus.ts" />
/// <reference path="actor.ts" />
/// <reference path="map.ts" />
/// <reference path="gui.ts" />
var	root: Yendor.Console;
module Game {

	/*
		Class: Engine
		Handles frame rendering and world updating.
	*/
	class Engine implements ActorManager, EventListener, GuiManager {
		player: Player;
		actors: Actor[] = [];
		corpses: Actor[] = [];
		items: Actor[] = [];
		map: Map;
		rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();
		status : GameStatus = GameStatus.STARTUP;
		guis: Gui[] = [];

		/*
			Constructor: constructor
		*/
		constructor() {
			this.player = new Game.Player(Constants.CONSOLE_WIDTH/2, Constants.CONSOLE_HEIGHT/2, '@', 'player', '#fff');
			this.map = new Map( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT );
			EventBus.getInstance().init(this, this.map);
			this.actors.push(this.player);
			var dungeonBuilder:BspDungeonBuilder = new BspDungeonBuilder();
			dungeonBuilder.build(this.map, this);
			EventBus.getInstance().registerListener(this, EventType.CHANGE_STATUS);
			EventBus.getInstance().registerListener(this, EventType.REMOVE_ACTOR);

			var statusPanel: Gui = new StatusPanel( Constants.CONSOLE_WIDTH, Constants.STATUS_PANEL_HEIGHT );
			statusPanel.show();
			this.addGui(statusPanel, "statusPanel", 0, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);

			var inventoryPanel: Gui = new InventoryPanel( Constants.INVENTORY_PANEL_WIDTH, Constants.INVENTORY_PANEL_HEIGHT, this.player );
			this.addGui(inventoryPanel, "inventoryPanel", Math.floor(Constants.CONSOLE_WIDTH/2 - Constants.INVENTORY_PANEL_WIDTH/2), 0);
		}

		/*
			ActorManager interface
		*/
		getPlayer() : Actor {
			return this.player;
		}

		addCreature( actor:Actor ) {
			this.actors.push(actor);
		}

		addItem( actor:Actor ) {
			this.items.push(actor);
		}

		getCreatures(): Actor[] {
			return this.actors;
		}

		getItems(): Actor[] {
			return this.items;
		}

		getCorpses(): Actor[] {
			return this.corpses;
		}

		/*
			GuiManager interface
		*/
		addGui(gui:Gui, name:string,x:number,y:number) {
			gui.moveTo(x,y);
			this.guis.push(gui)
		}

		renderGui(rootConsole: Yendor.Console) {
			for (var i:number = 0; i < this.guis.length; i++) {
				var gui:Gui = this.guis[i];
				if ( gui.isVisible()) {
					gui.render(this.map, this, rootConsole);
				}
			}
		}

		/*
			Function: findClosestActor

			In the `actors` array, find the closest actor (except the player) from position `pos` within `range`.
			If range is 0, no range limitation.
		*/
		findClosestActor( pos: Yendor.Position, range:number, actors:Actor[] ) : Actor {
			var bestDistance:number = 1E8;
			var closestActor:Actor = undefined;
			var player:Actor = this.getPlayer();
			actors.forEach(function(actor){		
				if ( actor != player ) {		
					var distance:number = Yendor.Position.distance(pos, actor);
					if ( distance < bestDistance && (distance < range || range == 0) ) {
						bestDistance = distance;
						closestActor = actor;
					}
				}
			});
			return closestActor;
		}

		/*
			Function: findActorsOnCell

			Parameters:
			pos - a position on the map
			actors - the list of actors to scan (either actors, corpses or items)

			Returns:
			an array containing all the living actors on the cell

		*/
		findActorsOnCell( pos: Yendor.Position, actors:Actor[]) : Actor[] {
			var actorsOnCell: Actor[] = [];
			var nbActors: number = actors.length;
			for (var i = 0; i < nbActors; i++) {
				var actor:Actor = actors[i];
				if ( actor.x == pos.x && actor.y == pos.y ) {
					actorsOnCell.push(actor);
				}
			}
			return actorsOnCell;
		}

		/*
			Function: processEvent
			Handle <CHANGE_STATUS> events (see <EventListener>)

			Parameters:
				event - the CHANGE_STATUS event
		*/
		processEvent(event:Event<any>) {
			if ( event.type == EventType.CHANGE_STATUS ) {
				this.status = event.data;
			} else if ( event.type == EventType.REMOVE_ACTOR ) {
				var item:Actor = event.data;
				this.removeItem(item);
			}
		}

		private removeItem(item:Actor) {
			var idx:number = this.items.indexOf(item);
			if ( idx != -1 ) {
				this.items.splice(idx,1);
			}
		}

		private renderActors(actors:Actor[]) {
			var nbActors: number = actors.length;
			for (var i = 0; i < nbActors; i++) {
				var actor:Actor = actors[i];
				if ( this.map.isInFov( actor.x, actor.y)) {
					actor.render();
				}
			}			
		}

		/*
			Function: render
			The actual frame rendering. Render objects in this order:
			- the map
			- the corpses
			- the living actors
			- the GUI
		*/
		private render() {
			root.clearText();
			this.map.render();
			this.renderActors(this.corpses);
			this.renderActors(this.items);
			this.renderActors(this.actors);
			this.renderGui(root);
		}

		/*
			Function: updateActors
			Triggers actors' A.I. during a new game turn.
			Moves the dead actors from the actor list to the corpse list.
		*/
		private updateActors() {
			var nbActors: number = this.actors.length;
			for (var i = 1; i < nbActors; i++) {
				var actor:Actor = this.actors[i];
				actor.update( this.map, this );
				if ( actor.destructible && actor.destructible.isDead() ) {
					this.actors.splice(i,1);
					i--;
					nbActors--;
					this.corpses.push(actor);
				}
			}			
		}

		/*
			Function: handleKeypress
			Triggered when the player presses a key. Updates the game world and possibly starts a new turn for NPCs.

			Parameters:
			event - the KeyboardEvent
		*/
		handleKeypress(event: KeyboardEvent) {
			EventBus.getInstance().publishEvent(new Event<KeyboardEvent>(EventType.KEY_PRESSED, event));
			this.player.ai.update(this.player, this.map, this);
			if ( this.status == GameStatus.NEW_TURN )  {
				this.updateActors();
				this.status = GameStatus.IDLE;
			}
		}

		/*
			Function: handleNewFrame
			Render a new frame. Frame rate is not tied to game turns to allow animations between turns.
			This function is called by the browser before a screen repaint.
			The number of callbacks is usually 60 times per second, but will generally match the display refresh rate 
			in most web browsers as per W3C recommendation. The callback rate may be reduced to a lower rate when running in background tabs.

			Parameters:
			time - elapsed time since the last frame in milliseconds
		*/
		handleNewFrame (time:number) {
			if ( this.status == GameStatus.STARTUP ) {
				this.player.ai.update(this.player, this.map, this);
				this.status = GameStatus.IDLE;
			}
			this.render();
			root.render();
		}

		/*
			Function: handleMouseMove
			Triggered by mouse motion events.

			Parameters:
			event - the JQueryMouseEventObject
		*/
		handleMouseMove(event: JQueryMouseEventObject) {
			var pos:Yendor.Position = root.getPositionFromPixels( event.pageX, event.pageY );
			EventBus.getInstance().publishEvent(new Event<Yendor.Position>( EventType.MOUSE_MOVE, pos));
		}
	}

	var engine = new Engine();

	/*
		Section: Game startup

		Function: log
		Utility to send a LOG_MESSAGE event on the event bus.
	*/
	log = function(text: string, color:Yendor.Color='white') {
		EventBus.getInstance().publishEvent(new Event<Message>(EventType.LOG_MESSAGE,new Message(color,text)));
	}

	/*
		This function is called when the document has finished loading in the browser.
		It creates the root console, register the keyboard and mouse event callbacks, and starts the frame rendering loop.
	*/
	$(function(){
		Yendor.init();
		root = new Yendor.PixiConsole( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT, '#ffffff', '#000000', '#console', 'terminal.png' );
		$(document).keydown(engine.handleKeypress.bind(engine));
		$(document).mousemove(engine.handleMouseMove.bind(engine));
		Yendor.loop(engine.handleNewFrame.bind(engine));
	});
}