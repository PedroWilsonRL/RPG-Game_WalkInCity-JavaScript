const GAME_WIDTH = 880;
const GAME_HEIGHT = 700;

window.addEventListener('load', function () {
        const backgroundMusic = new Audio('assets/music/music_city.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.2; 
    backgroundMusic.play().catch(e => {
        console.warn("Autoplay bloqueado. Música iniciará após interação do usuário.");
        const resumeMusic = () => {
            backgroundMusic.play();
            window.removeEventListener('keydown', resumeMusic);
            window.removeEventListener('mousedown', resumeMusic);
        };
        window.addEventListener('keydown', resumeMusic);
        window.addEventListener('mousedown', resumeMusic);
    });

    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    const headGif = new Image();
    headGif.src = 'assets/characters/alphonse_elric head.gif';

    const speechBubble = new Image();
    speechBubble.src = 'assets/characters/pixel_bubble_speech.png';

    const dialogBox = new Image();
    dialogBox.src = 'assets/characters/dialog_box1.png'; 

    function isColliding(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    class InputHandler {
        constructor() {
            this.keys = {};
            this.justPressed = {};
            window.addEventListener('keydown', e => {
                if (!this.keys[e.key]) this.justPressed[e.key] = true;
                this.keys[e.key] = true;
            });
            window.addEventListener('keyup', e => {
                this.keys[e.key] = false;
                this.justPressed[e.key] = false;
            });
        }

        clearPressed() {
            this.justPressed = {};
        }
    }

    class CollisionMap {
        constructor() {
            this.blockedTiles = new Set();
            [
                [18, 11], [18, 10], [18, 9], [18, 8], [18, 7],
                [15, 11], [16, 11], [17, 11], [14, 11], [13, 11],
                [12, 11], [12, 10], [12, 9], [12, 8], [13, 8],
                [14, 8], [15, 8], [16, 8], [17, 8], [18, 8], [15, 4],
                
            ].forEach(([col, row]) => this.blockedTiles.add(`${col},${row}`));
        }

        isBlocked(x, y) {
            const col = Math.floor(x / 32);
            const row = Math.floor(y / 32);
            return this.blockedTiles.has(`${col},${row}`);
        }
    }

    class Player {
        constructor(mapWidth, mapHeight, collisionMap) {
            this.frameWidth = 162;
            this.frameHeight = 233;
            this.width = 32;
            this.height = 46;
            const startCol = 15;
            const startRow = 12;
            this.x = startCol * 32;
            this.y = startRow * 32;
            this.image = new Image();
            this.image.src = 'assets/characters/edward_elric.png';
            this.shadowImage = new Image();
            this.shadowImage.src = 'assets/characters/shadow.png';
            this.shadowWidth = 35;
            this.shadowHeight = 42;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 2;
            this.fps = 8;
            this.frameInterval = 1000 / this.fps;
            this.frameTimer = 0;
            this.speed = 3;
            this.velocityX = 0;
            this.velocityY = 0;
            this.mapWidth = mapWidth;
            this.mapHeight = mapHeight;
            this.collisionMap = collisionMap;
            this.name = "Edward Elric";
            this.maxHealth = 100;
            this.currentHealth = 75;
        }

        update(input, deltaTime, npc) {
            this.velocityX = 0;
            this.velocityY = 0;
            if (input.keys['ArrowRight']) {
                this.velocityX = this.speed;
                this.frameY = 3;
            } else if (input.keys['ArrowLeft']) {
                this.velocityX = -this.speed;
                this.frameY = 2;
            } else if (input.keys['ArrowUp']) {
                this.velocityY = -this.speed;
                this.frameY = 1;
            } else if (input.keys['ArrowDown']) {
                this.velocityY = this.speed;
                this.frameY = 0;
            }

            if (this.velocityX !== 0 || this.velocityY !== 0) {
                if (this.frameTimer > this.frameInterval) {
                    this.frameX = (this.frameX + 1) % (this.maxFrame + 1);
                    this.frameTimer = 0;
                } else {
                    this.frameTimer += deltaTime;
                }

                const nextX = this.x + this.velocityX;
                const nextY = this.y + this.velocityY;
                const futurePlayer = { x: nextX, y: nextY, width: this.width, height: this.height };
                const npcRect = { x: npc.x, y: npc.y, width: npc.width, height: npc.height };

                if (!this.collisionMap.isBlocked(nextX, nextY) && !isColliding(futurePlayer, npcRect)) {
                    this.x = nextX;
                    this.y = nextY;
                }
            } else {
                this.frameX = 1;
            }

            this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.width));
            this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.height));
        }

        draw(context, cameraX, cameraY) {
            context.drawImage(this.shadowImage, this.x - cameraX, this.y - cameraY, this.shadowWidth, this.shadowHeight);
            context.drawImage(this.image, this.frameX * this.frameWidth, this.frameY * this.frameHeight, this.frameWidth, this.frameHeight, this.x - cameraX, this.y - cameraY, this.width, this.height);
        }
    }

    class NPC {
        constructor(mapWidth, mapHeight, collisionMap, xStart, yStart, xEnd, yEnd, speed = 1) {
            this.frameWidth = 162;
            this.frameHeight = 233;
            this.width = 32;
            this.height = 46;
            this.x = xStart;
            this.y = yStart;
            this.xStart = xStart;
            this.yStart = yStart;
            this.xEnd = xEnd;
            this.yEnd = yEnd;
            this.image = new Image();
            this.image.src = 'assets/characters/alphonse_elric - Copia.png';
            this.shadowImage = new Image();
            this.shadowImage.src = 'assets/characters/shadow.png';
            this.shadowWidth = 35;
            this.shadowHeight = 42;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 2;
            this.fps = 8;
            this.frameInterval = 1000 / this.fps;
            this.frameTimer = 0;
            this.speed = speed;
            this.directionX = 1;
            this.directionY = 0;
            this.mapWidth = mapWidth;
            this.mapHeight = mapHeight;
            this.collisionMap = collisionMap;
            this.collidingWithPlayer = false;
        }

        update(deltaTime, player) {
            let dx = this.xEnd - this.x;
            let dy = this.yEnd - this.y;
            const distance = Math.hypot(dx, dy);
            const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
            const npcRect = { x: this.x, y: this.y, width: this.width, height: this.height };
            this.collidingWithPlayer = isColliding(playerRect, npcRect);

            if (!this.collidingWithPlayer && distance > 1) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                this.x += dirX * this.speed;
                this.y += dirY * this.speed;
                this.directionX = dirX;
                this.directionY = dirY;

                this.frameY = Math.abs(dx) > Math.abs(dy) ? (dirX > 0 ? 3 : 2) : (dirY > 0 ? 0 : 1);

                if (this.frameTimer > this.frameInterval) {
                    this.frameX = (this.frameX + 1) % (this.maxFrame + 1);
                    this.frameTimer = 0;
                } else {
                    this.frameTimer += deltaTime;
                }
            } else if (distance <= 1) {
                [this.xStart, this.xEnd] = [this.xEnd, this.xStart];
                [this.yStart, this.yEnd] = [this.yEnd, this.yStart];
            }

            this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.width));
            this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.height));
        }

        draw(context, cameraX, cameraY) {
            context.drawImage(this.shadowImage, this.x - cameraX, this.y - cameraY, this.shadowWidth, this.shadowHeight);
            context.drawImage(this.image, this.frameX * this.frameWidth, this.frameY * this.frameHeight, this.frameWidth, this.frameHeight, this.x - cameraX, this.y - cameraY, this.width, this.height);
            if (this.collidingWithPlayer) {
                const bubbleWidth = 40;
                const bubbleHeight = 30;
                const bubbleX = this.x - cameraX + this.width / 2 - bubbleWidth / 2;
                const bubbleY = this.y - cameraY - bubbleHeight + 5;
                context.drawImage(speechBubble, bubbleX, bubbleY, bubbleWidth, bubbleHeight);
            }
        }
    }

    class GameWorld {
        constructor() {
            this.mapImage = new Image();
            this.mapImage.src = 'assets/map/city_full_map.png';
            this.upperImage = new Image();
            this.upperImage.src = 'assets/map/city_full_map upper.png';
            this.mapWidth = 1024;
            this.mapHeight = 1024;
        }

        drawBackground(context, cameraX, cameraY) {
            context.drawImage(this.mapImage, -cameraX, -cameraY, this.mapWidth, this.mapHeight);
        }

        drawUpper(context, cameraX, cameraY) {
            context.drawImage(this.upperImage, -cameraX, -cameraY, this.mapWidth, this.mapHeight);
        }
    }

    function drawPlayerStatus(ctx, player) {
        const boxX = 10;
        const boxY = 10;
        const boxWidth = 200;
        const boxHeight = 70;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        ctx.drawImage(headGif, boxX + 5, boxY + 5, 48, 48);
        ctx.fillStyle = 'white';
        ctx.font = '48px game over';
        ctx.fillText(player.name, boxX + 60, boxY + 20);
        const lifePercent = player.currentHealth / player.maxHealth;
        const barX = boxX + 60;
        const barY = boxY + 30;
        const barWidth = 120;
        const barHeight = 10;
        ctx.fillStyle = 'red';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = 'limegreen';
        ctx.fillRect(barX, barY, barWidth * lifePercent, barHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    const input = new InputHandler();
    const world = new GameWorld();
    const collisionMap = new CollisionMap();
    const player = new Player(world.mapWidth, world.mapHeight, collisionMap);
    const npc = new NPC(world.mapWidth, world.mapHeight, collisionMap, 10 * 32, 13 * 32, 13 * 32, 13 * 32);

    let lastTime = 0;
    let showDialog = false;
    const dialogLines = ["Hi brother!", "Have you considered going to GitHub.com/PedroWilsonRL?"]; 
    let currentLineIndex = 0;
    let currentCharIndex = 0;
    let typingSpeed = 50; 
    let lastTypingTime = 0;
    let currentDisplayedText = "";
    let isTyping = false;


    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        const cameraX = Math.max(0, Math.min(player.x + player.width / 2 - GAME_WIDTH / 2, world.mapWidth - GAME_WIDTH));
        const cameraY = Math.max(0, Math.min(player.y + player.height / 2 - GAME_HEIGHT / 2, world.mapHeight - GAME_HEIGHT));
        player.update(input, deltaTime, npc);
        npc.update(deltaTime, player);
        world.drawBackground(ctx, cameraX, cameraY);
        npc.draw(ctx, cameraX, cameraY);
        player.draw(ctx, cameraX, cameraY);
        world.drawUpper(ctx, cameraX, cameraY);
        drawPlayerStatus(ctx, player);

        if (npc.collidingWithPlayer && input.justPressed['z']) {
    if (!showDialog) {
        showDialog = true;
        currentLineIndex = 0;
        currentCharIndex = 0;
        currentDisplayedText = "";
        isTyping = true;
    } else {
        const fullText = dialogLines[currentLineIndex];
        if (currentCharIndex < fullText.length) {
            currentCharIndex = fullText.length;
            currentDisplayedText = fullText;
        } else {
            currentLineIndex++;
            if (currentLineIndex < dialogLines.length) {
                currentCharIndex = 0;
                currentDisplayedText = "";
                isTyping = true;
            } else {
                showDialog = false;
            }
        }
    }
}



        if (showDialog) {
    const dialogWidth = 782;
    const dialogHeight = 170;
    const dialogX = (GAME_WIDTH - dialogWidth) / 2;
    const dialogY = GAME_HEIGHT - dialogHeight - 20;
    ctx.drawImage(dialogBox, dialogX, dialogY, dialogWidth, dialogHeight);

    ctx.fillStyle = 'black';
    ctx.font = '63px game over';

    const fullText = dialogLines[currentLineIndex];

    if (currentCharIndex < fullText.length) {
        if (timeStamp - lastTypingTime > typingSpeed) {
            currentCharIndex++;
            currentDisplayedText = fullText.substring(0, currentCharIndex);
            lastTypingTime = timeStamp;
        }
    } else {
        currentDisplayedText = fullText;
        isTyping = false;
    }

    ctx.fillText(currentDisplayedText, dialogX + 50, dialogY + 85);
}



        input.clearPressed();
        requestAnimationFrame(animate);
    }

    animate(0);
});
