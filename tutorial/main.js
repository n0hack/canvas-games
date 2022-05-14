// DOM Element 연결
const elScore = document.querySelector('#score');
const elStartGameBtn = document.querySelector('#startBtn');
const elModal = document.querySelector('#modal');
const elBigScore = document.querySelector('#bigScore');
// Canvas 초기화 (2D / 사이즈)
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

// Player 클래스 정의
class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    // ctx.fill 메서드는 ctx.closePath()를 호출하지 않아도 됨
    ctx.fill();
  }
}

// Projectile 클래스 정의
class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

// Enemy 클래스 정의
class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

// Particle 클래스 정의
class Particle {
  // 마찰 계수
  static friction = 0.99;
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    // 점차 알파값을 0으로 만들어 사라지게 할 예정
    this.alpha = 1;
  }

  draw() {
    // 현재 콘텍스트 상태 저장
    ctx.save();
    // 이 이후 그려지는 도형들에 대해 투명도 조절
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    // 저장해 둔 콘텍스트 복구
    ctx.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= Particle.friction;
    this.velocity.y *= Particle.friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

// 게임 초기 설정
let player;
let projectiles;
let enemies;
let particles;

function init() {
  // 오브젝트 초기화
  player = new Player(x, y, 10, 'white');
  projectiles = [];
  enemies = [];
  particles = [];
  // 점수 초기화
  score = 0;
  elScore.innerHTML = score;
  elBigScore.innerHTML = score;
}

// 적 스폰
function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 4) + 4;
    let x, y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

// 애니메이션
let animationId;
let score = 0;

function animate() {
  animationId = requestAnimationFrame(animate);
  // 콘텍스트를 매순간 채움
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.draw();

  // 이펙트 처리
  particles.forEach((particle, particleIndex) => {
    if (particle.alpha <= 0) {
      particles.splice(particleIndex, 1);
    } else {
      particle.update();
    }
  });
  // 발사체 처리
  projectiles.forEach((projectile, projectileIndex) => {
    projectile.update();
    // 발사체 제거 (Remove from edges of screen)
    if (
      projectile.x - projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y - projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(projectileIndex, 1);
      }, 0);
    }
  });
  // 적 움직임 처리
  enemies.forEach((enemy, enemyIndex) => {
    enemy.update();
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    // 게임 종료
    if (dist - enemy.radius - player.radius < 1) {
      removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);
      elModal.style.display = 'flex';
      elBigScore.innerHTML = score;
    }

    projectiles.forEach((projectile, projectileIndex) => {
      // hypot은 두 지점간의 거리를 알려주는 메서드
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (dist - enemy.radius - projectile.radius < 1) {
        // 파티클 이펙트 생성
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              }
            )
          );
        }

        // 적이 큰 경우 축소 시키기
        if (enemy.radius - 10 > 5) {
          // 점수 증가
          score += 100;
          scoreEl.innerHTML = score;

          gsap.to(enemy, { radius: enemy.radius - 10 });
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          // 점수 증가
          score += 250;
          scoreEl.innerHTML = score;

          setTimeout(() => {
            enemies.splice(enemyIndex, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

function handleClick(event) {
  const angle = Math.atan2(
    event.clientY - canvas.height / 2,
    event.clientX - canvas.width / 2
  );
  const velocity = {
    x: Math.cos(angle) * 6,
    y: Math.sin(angle) * 6,
  };
  projectiles.push(
    new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity)
  );
}

startGameBtn.addEventListener('click', () => {
  init();
  animate();
  spawnEnemies();
  modalEl.style.display = 'none';

  // 이벤트
  setTimeout(() => {
    addEventListener('click', handleClick);
  }, 0);
});
