/// <reference path="tsUnit.ts" />
/// <reference path="../yendor/fov.ts" />
module Tests {
	export class FovTests extends tsUnit.TestClass {
		private fov : Yendor.Fov;
		setUp() {
			this.fov = new Yendor.Fov(20,20);
			for (var x = 0; x < 20; x++) {
				for ( var y = 0; y < 20; y++) {
					this.fov.setCell(x,y,true,true);
				}
			}
		}

		noWall() {
			this.fov.computeFov(10,10,20);

			for (var x = 0; x < 20; x++) {
				for ( var y = 0; y < 20; y++) {
					this.isTrue( this.fov.isTransparent(x,y), 'fov.isTransparent('+x+','+y+')' );
					this.isTrue( this.fov.isWalkable(x,y), 'fov.isWalkable('+x+','+y+')' );
					this.isTrue( this.fov.isInFov(x,y), 'fov.isInFov('+x+','+y+')' );
				}
			}
		}

		pillar() {
			this.fov.setCell(10, 10, false, false);
			this.fov.computeFov(10, 11, 20, true);

			for ( var x = 0; x < 20; x++) {
				this.isTrue( this.fov.isInFov(x,10), 'fov.isInFov('+x+',10)' );					
			}
			for ( var y = 0; y < 20; y++) {
				if ( y < 10 ) {
					this.isTrue( !this.fov.isInFov(10,y), '!fov.isInFov(10,'+y+')' );
				} else {
					this.isTrue( this.fov.isInFov(10,y), 'fov.isInFov(10,'+y+')' );					
				}
			}
		}

		wall() {
			for ( var x = 0; x < 20; x++) {
				this.fov.setCell(x, 10, false, false);
			}
			this.fov.computeFov(10, 11, 20, true);

			for ( var x = 0; x < 20; x++) {
				for ( var y = 0; y < 20; y++) {
					if ( y < 10 ) {
						this.isTrue( !this.fov.isInFov(x,y), '!fov.isInFov('+x+','+y+')' );
					} else {
						this.isTrue( this.fov.isInFov(x,y), 'fov.isInFov('+x+','+y+')' );					
					}
				}
			}
		}

		dontLightWalls() {
			for ( var x = 0; x < 20; x++) {
				this.fov.setCell(x, 10, false, false);
			}
			this.fov.computeFov(10, 11, 20, false);

			for ( var x = 0; x < 20; x++) {
				for ( var y = 0; y < 20; y++) {
					if ( y <= 10 ) {
						this.isTrue( !this.fov.isInFov(x,y), '!fov.isInFov('+x+','+y+')' );
					} else {
						this.isTrue( this.fov.isInFov(x,y), 'fov.isInFov('+x+','+y+')' );					
					}
				}
			}
		}		
	}
}
