/**
 * Pure calculation rules for Sky Ball 3D:
 * - Scoring and 3-star rating calculations
 * - AABB and sphere-box collision mathematics
 * - Ball physics kinematic integration (friction, gravity, coyote time, jump cuts)
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BoxCollider {
  min: Vec3;
  max: Vec3;
}

export interface BallState {
  position: Vec3;
  velocity: Vec3;
  radius: number;
  isGrounded: boolean;
  coyoteTimer: number; // seconds remaining to jump after leaving edge
  jumpBufferTimer: number; // seconds remaining for buffered jump input
}

export interface LevelScoreParams {
  completionTime: number; // in seconds
  parTime: number; // 3-star target
  coinsCollected: number;
  totalCoins: number;
  gemsCollected: number;
  totalGems: number;
}

/**
 * Calculates 1 to 3 star rating based on time and gems collected.
 * 3 Stars: beat par time AND collected all gems.
 * 2 Stars: beat par time OR collected >= 50% gems.
 * 1 Star: completed the level.
 */
export function calculateStarRating(params: LevelScoreParams): {
  stars: number;
  coinsEarned: number;
  timeBonus: number;
} {
  const { completionTime, parTime, coinsCollected, gemsCollected, totalGems } = params;
  
  const beatPar = completionTime <= parTime;
  const allGems = totalGems > 0 ? gemsCollected >= totalGems : true;
  const halfGems = totalGems > 0 ? gemsCollected >= Math.ceil(totalGems / 2) : true;

  let stars = 1;
  if (beatPar && allGems) {
    stars = 3;
  } else if (beatPar || halfGems) {
    stars = 2;
  }

  // Base coins from collected + star bonuses
  const timeBonus = beatPar ? Math.max(10, Math.round((parTime - completionTime) * 2)) : 0;
  const starBonus = stars * 15;
  const coinsEarned = coinsCollected + starBonus + timeBonus;

  return { stars, coinsEarned, timeBonus };
}

/**
 * Checks sphere vs Axis-Aligned Bounding Box (AABB) intersection and computes penetration depth + contact normal.
 */
export function checkSphereAABBCollision(
  sphereCenter: Vec3,
  radius: number,
  box: BoxCollider
): { collides: boolean; penetration: number; normal: Vec3; contactPoint: Vec3 } {
  // Find closest point on box to sphere center
  const closestX = Math.max(box.min.x, Math.min(sphereCenter.x, box.max.x));
  const closestY = Math.max(box.min.y, Math.min(sphereCenter.y, box.max.y));
  const closestZ = Math.max(box.min.z, Math.min(sphereCenter.z, box.max.z));

  const distX = sphereCenter.x - closestX;
  const distY = sphereCenter.y - closestY;
  const distZ = sphereCenter.z - closestZ;

  const distSq = distX * distX + distY * distY + distZ * distZ;

  if (distSq > radius * radius) {
    return {
      collides: false,
      penetration: 0,
      normal: { x: 0, y: 1, z: 0 },
      contactPoint: { x: closestX, y: closestY, z: closestZ },
    };
  }

  const dist = Math.sqrt(distSq);
  let normal: Vec3;
  let penetration: number;

  if (dist < 0.0001) {
    // Sphere center is inside or precisely on box edge - push upward
    normal = { x: 0, y: 1, z: 0 };
    penetration = radius;
  } else {
    normal = {
      x: distX / dist,
      y: distY / dist,
      z: distZ / dist,
    };
    penetration = radius - dist;
  }

  return {
    collides: true,
    penetration,
    normal,
    contactPoint: { x: closestX, y: closestY, z: closestZ },
  };
}

/**
 * Integrates single-step ball kinematic physics
 */
export function stepBallPhysics(
  ball: BallState,
  input: { x: number; z: number; jumpJustPressed: boolean; jumpHeld: boolean },
  dt: number,
  constants = {
    gravity: 24.0,
    accel: 28.0,
    airAccel: 14.0,
    maxSpeed: 16.0,
    friction: 0.92,
    airFriction: 0.985,
    jumpForce: 10.5,
    coyoteMax: 0.12,
    jumpBufferMax: 0.12,
  }
): BallState {
  const nextBall = { ...ball, velocity: { ...ball.velocity }, position: { ...ball.position } };

  // Update timers
  if (nextBall.isGrounded) {
    nextBall.coyoteTimer = constants.coyoteMax;
  } else {
    nextBall.coyoteTimer = Math.max(0, nextBall.coyoteTimer - dt);
  }

  if (input.jumpJustPressed) {
    nextBall.jumpBufferTimer = constants.jumpBufferMax;
  } else {
    nextBall.jumpBufferTimer = Math.max(0, nextBall.jumpBufferTimer - dt);
  }

  // Acceleration input
  const canMove = true;
  if (canMove) {
    const currentAccel = nextBall.isGrounded ? constants.accel : constants.airAccel;
    nextBall.velocity.x += input.x * currentAccel * dt;
    nextBall.velocity.z += input.z * currentAccel * dt;
  }

  // Speed clamping on horizontal plane
  const horizSpeedSq = nextBall.velocity.x * nextBall.velocity.x + nextBall.velocity.z * nextBall.velocity.z;
  const maxSpeedSq = constants.maxSpeed * constants.maxSpeed;
  if (horizSpeedSq > maxSpeedSq) {
    const factor = constants.maxSpeed / Math.sqrt(horizSpeedSq);
    nextBall.velocity.x *= factor;
    nextBall.velocity.z *= factor;
  }

  // Horizontal friction / damping
  const frictionFactor = nextBall.isGrounded ? constants.friction : constants.airFriction;
  nextBall.velocity.x *= Math.pow(frictionFactor, dt * 60);
  nextBall.velocity.z *= Math.pow(frictionFactor, dt * 60);

  // Jump execution with coyote time and buffered input
  if (nextBall.jumpBufferTimer > 0 && nextBall.coyoteTimer > 0) {
    nextBall.velocity.y = constants.jumpForce;
    nextBall.isGrounded = false;
    nextBall.coyoteTimer = 0;
    nextBall.jumpBufferTimer = 0;
  } else if (!nextBall.isGrounded) {
    // Apply gravity
    nextBall.velocity.y -= constants.gravity * dt;

    // Variable jump cut: if ascending and jump button released, dampen upward speed
    if (!input.jumpHeld && nextBall.velocity.y > 0) {
      nextBall.velocity.y *= Math.pow(0.5, dt * 60);
    }
  }

  // Position integration
  nextBall.position.x += nextBall.velocity.x * dt;
  nextBall.position.y += nextBall.velocity.y * dt;
  nextBall.position.z += nextBall.velocity.z * dt;

  return nextBall;
}
