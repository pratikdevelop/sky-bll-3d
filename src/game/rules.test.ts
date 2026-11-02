import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStarRating, checkSphereAABBCollision, stepBallPhysics } from './rules.ts';

test('calculateStarRating awards 3 stars when beating par time and collecting all gems', () => {
  const result = calculateStarRating({
    completionTime: 28,
    parTime: 35,
    coinsCollected: 25,
    totalCoins: 25,
    gemsCollected: 3,
    totalGems: 3,
  });

  assert.equal(result.stars, 3);
  assert.ok(result.coinsEarned > 25);
  assert.ok(result.timeBonus > 0);
});

test('calculateStarRating awards 2 stars when beating par time but missing gems', () => {
  const result = calculateStarRating({
    completionTime: 30,
    parTime: 35,
    coinsCollected: 15,
    totalCoins: 25,
    gemsCollected: 1,
    totalGems: 3,
  });

  assert.equal(result.stars, 2);
});

test('calculateStarRating awards 1 star when failing par time and under half gems', () => {
  const result = calculateStarRating({
    completionTime: 50,
    parTime: 35,
    coinsCollected: 10,
    totalCoins: 25,
    gemsCollected: 0,
    totalGems: 3,
  });

  assert.equal(result.stars, 1);
  assert.equal(result.timeBonus, 0);
});

test('checkSphereAABBCollision detects resting contact on top of a platform', () => {
  const box = {
    min: { x: -5, y: -0.5, z: -5 },
    max: { x: 5, y: 0.5, z: 5 },
  };

  // Ball resting exactly on top of box with radius 0.5
  const sphereCenter = { x: 0, y: 0.9, z: 0 };
  const collision = checkSphereAABBCollision(sphereCenter, 0.5, box);

  assert.equal(collision.collides, true);
  assert.ok(collision.penetration > 0);
  assert.equal(collision.normal.y, 1);
  assert.equal(collision.contactPoint.y, 0.5);
});

test('checkSphereAABBCollision rejects sphere outside box bounds', () => {
  const box = {
    min: { x: -5, y: -0.5, z: -5 },
    max: { x: 5, y: 0.5, z: 5 },
  };

  const sphereCenter = { x: 0, y: 2.0, z: 0 };
  const collision = checkSphereAABBCollision(sphereCenter, 0.5, box);

  assert.equal(collision.collides, false);
});

test('stepBallPhysics applies acceleration and gravity correctly', () => {
  const initialBall = {
    position: { x: 0, y: 2, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    radius: 0.5,
    isGrounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
  };

  // Step 1: falling under gravity with forward input
  const stepped = stepBallPhysics(
    initialBall,
    { x: 0, z: 1, jumpJustPressed: false, jumpHeld: false },
    0.016
  );

  assert.ok(stepped.velocity.y < 0, 'Gravity should decrease Y velocity');
  assert.ok(stepped.velocity.z > 0, 'Z input should increase Z velocity');
  assert.ok(stepped.position.y < 2, 'Position Y should descend');
});

test('stepBallPhysics executes jump when grounded and jump is pressed', () => {
  const groundedBall = {
    position: { x: 0, y: 0.5, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    radius: 0.5,
    isGrounded: true,
    coyoteTimer: 0.12,
    jumpBufferTimer: 0,
  };

  const jumped = stepBallPhysics(
    groundedBall,
    { x: 0, z: 0, jumpJustPressed: true, jumpHeld: true },
    0.016
  );

  assert.ok(jumped.velocity.y > 5, 'Jump should grant substantial upward velocity');
  assert.equal(jumped.isGrounded, false);
});
