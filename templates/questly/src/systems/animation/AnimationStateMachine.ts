/**
 * AnimationStateMachine - Manages character animation states and transitions
 * Phase 5.3 - Animation System
 */

export type AnimationState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'jump'
  | 'fall'
  | 'land'
  | 'crouch'
  | 'crouch-walk'
  | 'attack'
  | 'block'
  | 'dodge'
  | 'interact'
  | 'pickup'
  | 'death';

export interface AnimationTransition {
  from: AnimationState;
  to: AnimationState;
  condition: () => boolean;
  blendTime?: number;
}

export interface AnimationConfig {
  name: string;
  state: AnimationState;
  loop: boolean;
  speed: number;
  weight?: number;
}

export class AnimationStateMachine {
  private currentState: AnimationState = 'idle';
  private previousState: AnimationState = 'idle';
  private transitions: AnimationTransition[] = [];
  private stateConfigs: Map<AnimationState, AnimationConfig> = new Map();
  private transitionBlendTime: number = 0.2;

  constructor() {
    this.setupDefaultStates();
    this.setupDefaultTransitions();
  }

  /**
   * Setup default animation states
   */
  private setupDefaultStates(): void {
    this.stateConfigs.set('idle', { name: 'idle', state: 'idle', loop: true, speed: 1.0 });
    this.stateConfigs.set('walk', { name: 'walk', state: 'walk', loop: true, speed: 1.0 });
    this.stateConfigs.set('run', { name: 'run', state: 'run', loop: true, speed: 1.0 });
    this.stateConfigs.set('sprint', { name: 'sprint', state: 'sprint', loop: true, speed: 1.2 });
    this.stateConfigs.set('jump', { name: 'jump', state: 'jump', loop: false, speed: 1.0 });
    this.stateConfigs.set('fall', { name: 'fall', state: 'fall', loop: true, speed: 1.0 });
    this.stateConfigs.set('land', { name: 'land', state: 'land', loop: false, speed: 1.0 });
    this.stateConfigs.set('crouch', { name: 'crouch', state: 'crouch', loop: true, speed: 1.0 });
    this.stateConfigs.set('crouch-walk', { name: 'crouch-walk', state: 'crouch-walk', loop: true, speed: 0.8 });
    this.stateConfigs.set('attack', { name: 'attack', state: 'attack', loop: false, speed: 1.0 });
    this.stateConfigs.set('block', { name: 'block', state: 'block', loop: true, speed: 1.0 });
    this.stateConfigs.set('dodge', { name: 'dodge', state: 'dodge', loop: false, speed: 1.0 });
    this.stateConfigs.set('interact', { name: 'interact', state: 'interact', loop: false, speed: 1.0 });
    this.stateConfigs.set('pickup', { name: 'pickup', state: 'pickup', loop: false, speed: 1.0 });
    this.stateConfigs.set('death', { name: 'death', state: 'death', loop: false, speed: 1.0 });
  }

  /**
   * Setup default transitions
   */
  private setupDefaultTransitions(): void {
    // Movement transitions
    this.addTransition('idle', 'walk', () => false); // Will be set by input
    this.addTransition('walk', 'run', () => false);
    this.addTransition('run', 'sprint', () => false);
    this.addTransition('idle', 'jump', () => false);
    this.addTransition('walk', 'jump', () => false);
    this.addTransition('run', 'jump', () => false);
    this.addTransition('jump', 'fall', () => false);
    this.addTransition('fall', 'land', () => false);
    this.addTransition('land', 'idle', () => false);

    // Crouch transitions
    this.addTransition('idle', 'crouch', () => false);
    this.addTransition('crouch', 'crouch-walk', () => false);
    this.addTransition('crouch-walk', 'crouch', () => false);
    this.addTransition('crouch', 'idle', () => false);

    // Combat transitions
    this.addTransition('idle', 'attack', () => false);
    this.addTransition('walk', 'attack', () => false);
    this.addTransition('run', 'attack', () => false);
    this.addTransition('idle', 'block', () => false);
    this.addTransition('idle', 'dodge', () => false);

    // Interaction transitions
    this.addTransition('idle', 'interact', () => false);
    this.addTransition('idle', 'pickup', () => false);
  }

  /**
   * Add a transition
   */
  addTransition(
    from: AnimationState,
    to: AnimationState,
    condition: () => boolean,
    blendTime?: number
  ): void {
    this.transitions.push({
      from,
      to,
      condition,
      blendTime: blendTime || this.transitionBlendTime,
    });
  }

  /**
   * Update state machine
   */
  update(input: {
    isMoving: boolean;
    isRunning: boolean;
    isSprinting: boolean;
    isCrouching: boolean;
    isOnGround: boolean;
    isJumping: boolean;
    isAttacking: boolean;
    isBlocking: boolean;
    isDodging: boolean;
    isInteracting: boolean;
  }): AnimationState {
    // Check transitions from current state
    const possibleTransitions = this.transitions.filter((t) => t.from === this.currentState);

    for (const transition of possibleTransitions) {
      if (transition.condition()) {
        // Check if transition is valid based on input
        if (this.isValidTransition(transition.to, input)) {
          this.previousState = this.currentState;
          this.currentState = transition.to;
          return this.currentState;
        }
      }
    }

    // Handle state-specific logic
    this.updateStateLogic(input);

    return this.currentState;
  }

  /**
   * Check if transition is valid based on input
   */
  private isValidTransition(to: AnimationState, input: any): boolean {
    switch (to) {
      case 'walk':
        return input.isMoving && !input.isRunning && !input.isSprinting && !input.isCrouching;
      case 'run':
        return input.isMoving && input.isRunning && !input.isSprinting && !input.isCrouching;
      case 'sprint':
        return input.isMoving && input.isSprinting && !input.isCrouching;
      case 'jump':
        return input.isJumping && input.isOnGround;
      case 'fall':
        return !input.isOnGround && !input.isJumping;
      case 'land':
        return input.isOnGround && this.previousState === 'fall';
      case 'crouch':
        return input.isCrouching && !input.isMoving;
      case 'crouch-walk':
        return input.isCrouching && input.isMoving;
      case 'attack':
        return input.isAttacking;
      case 'block':
        return input.isBlocking;
      case 'dodge':
        return input.isDodging;
      case 'interact':
        return input.isInteracting;
      default:
        return true;
    }
  }

  /**
   * Update state logic
   */
  private updateStateLogic(input: any): void {
    // Auto-transitions based on state
    if (this.currentState === 'attack' && !input.isAttacking) {
      // Return to previous state after attack
      this.currentState = this.previousState;
    }

    if (this.currentState === 'dodge' && !input.isDodging) {
      this.currentState = this.previousState;
    }

    if (this.currentState === 'interact' && !input.isInteracting) {
      this.currentState = this.previousState;
    }

    if (this.currentState === 'land' && input.isOnGround) {
      // Land animation completes, return to idle or movement
      this.currentState = input.isMoving ? (input.isRunning ? 'run' : 'walk') : 'idle';
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): AnimationState {
    return this.currentState;
  }

  /**
   * Get state config
   */
  getStateConfig(state: AnimationState): AnimationConfig | undefined {
    return this.stateConfigs.get(state);
  }

  /**
   * Force set state (for special cases)
   */
  setState(state: AnimationState): void {
    this.previousState = this.currentState;
    this.currentState = state;
  }
}
