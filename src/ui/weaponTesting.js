import { gameState } from '../state/gameState.js';
import { isOverlayActive, OverlayId } from '../state/overlayManager.js';

const TEST_COST = 150;

const clearHitboxes = () => {
  gameState.ui.weaponTesting.buttons.length = 0;
};

const containsPoint = (rect, x, y) => (
  rect && x >= rect.x && x <= rect.x2 && y >= rect.y && y <= rect.y2
);

export const handleWeaponTestingClick = (screenX, screenY) => {
  if (!isOverlayActive(OverlayId.WEAPON_TESTING)) return false;

  const buttonHit = gameState.ui.weaponTesting.buttons.find((btn) =>
    containsPoint(btn, screenX, screenY)
  );

  if (!buttonHit) return false;

  // Check if player has enough money
  if (gameState.player.money < TEST_COST) {
    return true; // Consumed click but no action
  }

  // Deduct money
  gameState.player.money -= TEST_COST;

  // Mark weapon as tested
  gameState.ui.weaponTesting.testedWeapons.add(buttonHit.roleId);

  // Result already pre-computed in gameState.case.weaponTestResults
  return true;
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 20, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.6;
  const height = gameState.config.canvasHeight * 0.75;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(18, 28, 54, 0.95)';
  ctx.strokeStyle = '#6d8cff';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const drawTitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#fefefe';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Weapon Testing Station', panel.x + panel.width / 2, panel.y + 16);
  ctx.restore();
};

const drawSubtitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Test recovered weapons for biological traces - $150 per test', panel.x + panel.width / 2, panel.y + 52);
  ctx.restore();
};

const getWeaponList = () => {
  return gameState.journal.entries.map((entry) => {
    const roleId = entry.id;
    const weaponCategory = entry.weaponCategory;
    const alreadyTested = gameState.ui.weaponTesting.testedWeapons.has(roleId);
    const testResult = alreadyTested ? gameState.case.weaponTestResults[roleId] : null;

    return {
      roleId,
      roleName: entry.roleName,
      weaponCategory,
      hasWeapon: weaponCategory !== null,
      alreadyTested,
      testResult
    };
  });
};

const drawWeaponList = (ctx, panel) => {
  const weapons = getWeaponList();
  const startY = panel.y + 96;
  const rowHeight = 44;
  const leftMargin = panel.x + 24;

  clearHitboxes();

  ctx.save();
  ctx.font = '18px "Courier New", monospace';
  ctx.textBaseline = 'middle';

  weapons.forEach((weapon, index) => {
    const y = startY + index * rowHeight;

    // Draw role name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fefefe';
    ctx.fillText(`${index + 1}. ${weapon.roleName}:`, leftMargin, y);

    // Draw weapon or "????"
    const weaponX = leftMargin + 200;
    if (!weapon.hasWeapon) {
      ctx.fillStyle = '#7b84a2';
      ctx.fillText('????', weaponX, y);
    } else {
      ctx.fillStyle = '#c5d8ff';
      ctx.fillText(weapon.weaponCategory, weaponX, y);

      // Draw test button or result
      const buttonX = weaponX + 180;
      if (weapon.alreadyTested) {
        // Show result
        const resultColor = weapon.testResult === 'clean' ? '#4afa5a' : '#ffd24a';
        ctx.fillStyle = resultColor;
        const resultText = weapon.testResult === 'clean' ? 'CLEAN' : 'INCONCLUSIVE';
        ctx.fillText(resultText, buttonX, y);
      } else {
        // Show test button
        const buttonWidth = 100;
        const buttonHeight = 28;
        const btnY = y - buttonHeight / 2;

        ctx.fillStyle = '#1c2742';
        ctx.strokeStyle = '#8effd6';
        ctx.lineWidth = 2;
        ctx.fillRect(buttonX, btnY, buttonWidth, buttonHeight);
        ctx.strokeRect(buttonX, btnY, buttonWidth, buttonHeight);

        ctx.fillStyle = '#8effd6';
        ctx.textAlign = 'center';
        ctx.fillText('Test $150', buttonX + buttonWidth / 2, y);

        // Store hitbox
        gameState.ui.weaponTesting.buttons.push({
          roleId: weapon.roleId,
          x: buttonX,
          y: btnY,
          x2: buttonX + buttonWidth,
          y2: btnY + buttonHeight
        });
      }
    }
  });

  ctx.restore();
};

const drawCredits = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#ffd24a';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`Credits: ${gameState.player.money}₡`, panel.x + panel.width / 2, panel.y + panel.height - 16);
  ctx.restore();
};

export const renderWeaponTesting = (ctx) => {
  if (!isOverlayActive(OverlayId.WEAPON_TESTING)) {
    clearHitboxes();
    return;
  }

  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawTitle(ctx, panel);
  drawSubtitle(ctx, panel);
  drawWeaponList(ctx, panel);
  drawCredits(ctx, panel);
};
