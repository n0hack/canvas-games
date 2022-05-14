import { gsap } from 'gsap';

// DOM 연결
const $score = document.querySelector<HTMLSpanElement>('#score');
const $startBtn = document.querySelector<HTMLButtonElement>('#startBtn');
const $modal = document.querySelector<HTMLDivElement>('#modal');
const $modalScore = document.querySelector<HTMLSpanElement>('#bigScore');
const canvas = document.querySelector<HTMLCanvasElement>('#canvas');

// Canvas 초기화 (2D Context / 사이즈)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

// 게임에서 사용할 데이터
const playerX = canvas.width / 2;
const playerY = canvas.height / 2;
let animationId: number;
let player: Player;
let projectiles: Projectile[];
let enemies: Enemy[];
let particles: Particle[];
let score = 0;

// 게임 오브젝트 인터페이스
interface GameObject {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity?: IVelocity;
  draw(): void;
  update?(): void;
}

interface IVelocity {
  x: number;
  y: number;
}

// Player 클래스
class Player implements GameObject {
  constructor(
    public x: number,
    public y: number,
    public radius: number,
    public color: string
  ) {}

  draw(): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    // ctx.fill 메서드는 closePath를 호출할 필요x
    ctx.fill();
  }
}

// Projectile 클래스
class Projectile implements GameObject {
  constructor(
    public x: number,
    public y: number,
    public radius: number,
    public color: string,
    public velocity: IVelocity
  ) {}

  draw(): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update(): void {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

// Enemy 클래스
class Enemy implements GameObject {
  constructor(
    public x: number,
    public y: number,
    public radius: number,
    public color: string,
    public velocity: IVelocity
  ) {}

  draw(): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update(): void {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

// Particle 클래스
class Particle implements GameObject {
  // 마찰 계수
  static friction: number = 0.99;
  // 알파 (점차 0으로 만들어 제거)
  public alpha: number;

  constructor(
    public x: number,
    public y: number,
    public radius: number,
    public color: string,
    public velocity: IVelocity
  ) {
    this.alpha = 1;
  }

  draw() {
    /* 
      globalAlpha를 설정하면 이후 도형들에 대해 투명도가 모두 적용된다. 
      따라서 콘텍스트 상태를 미리 저장해 두고, 필요한 도형에만 알파를 적용한 후 복구하는 식으로 구현한다.
    */
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
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

// 게임 초기화 함수
function initGame() {
  // 인스턴스
  player = new Player(playerX, playerY, 10, 'white');
  projectiles = [];
  enemies = [];
  particles = [];
  // 점수
  score = 0;
  $score.innerHTML = `${score}`;
  $modalScore.innerHTML = `${score}`;
}

// 적 생성 함수 (1초마다 생성)
function spawnEnemies() {
  setInterval(() => {
    // 크기 (최소 4, 최대 30)
    const minRadius = 4;
    const radius = Math.random() * (30 - minRadius) + minRadius;

    // 시작 위치
    let x: number, y: number;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    // 색 지정
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    // 플레이어와의 각도 계산
    const angle = Math.atan2(playerY - y, playerX - x);
    // 각도를 바탕으로 가속도 결정
    const velocity = { x: Math.cos(angle), y: Math.sin(angle) };
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

// 애니메이션 함수
function animate() {
  animationId = requestAnimationFrame(animate);
  // 매프레임마다 콘텍스트를 새롭게 채움
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 플레이어 그리기
  player.draw();

  // 이펙트 처리
  particles.forEach((particle, index) => {
    // 알파 값이 0이 되면 제거
    if (particle.alpha <= 0) particles.splice(index, 1);
    else particle.update();
  });

  // 발사체 처리
  projectiles.forEach((projectile, index) => {
    projectile.update();
    // 화면을 나가면 제거
    if (
      projectile.x - projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y - projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      /* 
        requestAnimationFrame과 동기화가 되지 않아
        깜빡일 수 있으므로 setTimeout으로 한 번 래핑하여 처리
      */
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    }
  });

  // 적 움직임, 충돌 처리
  enemies.forEach((enemy, enemyIndex) => {
    enemy.update();

    // hypot은 두 지점 사이의 거리를 구할 때 사용하는 메서드
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    // 거리가 1 미만이면 게임 오버
    if (dist - player.radius - enemy.radius < 1) {
      cancelAnimationFrame(animationId);
      removeEventListener('click', clickEvent);
      removeEventListener('touchstart', touchEvent);
      $modal.style.display = 'flex';
      $modalScore.innerHTML = `${score}`;
    }

    // 발사체와의 충돌 처리
    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      // 거리가 1 미만이면 radius의 2배만큼 파티클 생성
      if (dist - enemy.radius - projectile.radius < 1) {
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

        // 적이 큰 경우 크기 축소하고, 작은 경우 그대로 제거
        if (enemy.radius - 10 > 5) {
          // 점수 증가
          score += 100;
          $score.innerHTML = `${score}`;
          // 부드럽게 축소시킴
          gsap.to(enemy, { radius: enemy.radius - 10 });
          // 발사체 제거
          setTimeout(() => projectiles.splice(projectileIndex, 1), 0);
        } else {
          // 점수 증가
          score += 250;
          $score.innerHTML = `${score}`;
          // 적, 발사체 제거
          setTimeout(() => {
            enemies.splice(enemyIndex, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

// 화면 클릭 이벤트 핸들러
function clickEvent(event: PointerEvent) {
  let clickX: number, clickY: number;
  if (event.pointerType === 'touch') return;
  else {
    clickX = event.clientX;
    clickY = event.clientY;
  }

  const angle = Math.atan2(
    clickY - canvas.height / 2,
    clickX - canvas.width / 2
  );
  const velocity = {
    x: Math.cos(angle) * 6,
    y: Math.sin(angle) * 6,
  };
  projectiles.push(
    new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity)
  );
}

// 화면 터치 이벤트 핸들러
function touchEvent(event: TouchEvent) {
  let clickX = event.touches[0].clientX;
  let clickY = event.touches[0].clientY;

  const angle = Math.atan2(
    clickY - canvas.height / 2,
    clickX - canvas.width / 2
  );
  const velocity = {
    x: Math.cos(angle) * 6,
    y: Math.sin(angle) * 6,
  };
  projectiles.push(
    new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity)
  );
}

// 게임 시작
$startBtn.addEventListener('click', () => {
  initGame();
  animate();
  spawnEnemies();
  $modal.style.display = 'none';

  // 이벤트 연결
  setTimeout(() => addEventListener('click', clickEvent), 0);
  setTimeout(() => addEventListener('touchstart', touchEvent), 0);
});
