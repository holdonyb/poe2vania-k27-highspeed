import Phaser from 'phaser';
import { generateTextures } from '../utils/TextureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    generateTextures(this);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
