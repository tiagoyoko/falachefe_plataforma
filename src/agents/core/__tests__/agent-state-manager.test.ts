/**
 * Unit tests for Agent State Manager
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { AgentStateManager } from '../agent-state-manager'
import { StateManagerConfig, AgentState } from '../types'

describe('AgentStateManager', () => {
  let stateManager: AgentStateManager
  let config: StateManagerConfig

  beforeEach(() => {
    config = {
      healthCheckInterval: 30000,
      recoveryAttempts: 3,
      recoveryDelay: 5000,
      stateTransitionTimeout: 10000,
      autoRecovery: true
    }
    
    stateManager = new AgentStateManager(config)
  })

  afterEach(() => {
    stateManager.removeAllListeners()
  })

  describe('State Management', () => {
    it('should set initial state to inactive', () => {
      const state = stateManager.getState('agent-1')
      expect(state).toBe('inactive')
    })

    it('should set agent state successfully', async () => {
      await stateManager.setState('agent-1', 'active', 'Initial activation')
      
      const state = stateManager.getState('agent-1')
      expect(state).toBe('active')
    })

    it('should emit state change event', async () => {
      const eventSpy = jest.fn()
      stateManager.on('stateChanged', eventSpy)
      
      await stateManager.setState('agent-1', 'active', 'Test activation')
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'agent-1',
          oldState: 'inactive',
          newState: 'active',
          reason: 'Test activation'
        })
      )
    })

    it('should handle state transition timeout', async () => {
      // Mock a slow state transition
      const originalSetState = stateManager.setState
      jest.spyOn(stateManager, 'setState').mockImplementation(async (agentId, newState, reason) => {
        // Simulate timeout by not resolving
        return new Promise(() => {})
      })
      
      await expect(
        stateManager.setState('agent-1', 'active', 'Test')
      ).rejects.toThrow('State transition timeout')
      
      // Restore original method
      stateManager.setState = originalSetState
    })
  })

  describe('Agent Status Checks', () => {
    it('should return correct active status', async () => {
      expect(stateManager.isAgentActive('agent-1')).toBe(false)
      
      await stateManager.setState('agent-1', 'active')
      expect(stateManager.isAgentActive('agent-1')).toBe(true)
    })

    it('should return correct inactive status', async () => {
      await stateManager.setState('agent-1', 'inactive')
      expect(stateManager.isAgentActive('agent-1')).toBe(false)
    })

    it('should return correct error status', async () => {
      await stateManager.setState('agent-1', 'error')
      expect(stateManager.isAgentActive('agent-1')).toBe(false)
    })
  })

  describe('Statistics', () => {
    it('should return correct stats for single agent', async () => {
      await stateManager.setState('agent-1', 'active')
      
      const stats = stateManager.getStats()
      expect(stats.total).toBe(1)
      expect(stats.states.active).toBe(1)
      expect(stats.states.inactive).toBe(0)
      expect(stats.states.error).toBe(0)
    })

    it('should return correct stats for multiple agents', async () => {
      await stateManager.setState('agent-1', 'active')
      await stateManager.setState('agent-2', 'inactive')
      await stateManager.setState('agent-3', 'error')
      
      const stats = stateManager.getStats()
      expect(stats.total).toBe(3)
      expect(stats.states.active).toBe(1)
      expect(stats.states.inactive).toBe(1)
      expect(stats.states.error).toBe(1)
    })
  })

  describe('State Transitions', () => {
    it('should allow valid state transitions', async () => {
      // inactive -> active
      await stateManager.setState('agent-1', 'active')
      expect(stateManager.getState('agent-1')).toBe('active')
      
      // active -> inactive
      await stateManager.setState('agent-1', 'inactive')
      expect(stateManager.getState('agent-1')).toBe('inactive')
      
      // inactive -> error
      await stateManager.setState('agent-1', 'error')
      expect(stateManager.getState('agent-1')).toBe('error')
    })

    it('should handle error state transitions', async () => {
      await stateManager.setState('agent-1', 'error')
      
      // error -> inactive (recovery)
      await stateManager.setState('agent-1', 'inactive')
      expect(stateManager.getState('agent-1')).toBe('inactive')
      
      // inactive -> active (recovery)
      await stateManager.setState('agent-1', 'active')
      expect(stateManager.getState('agent-1')).toBe('active')
    })
  })

  describe('Agent Cleanup', () => {
    it('should remove agent state', () => {
      stateManager.removeAgent('agent-1')
      
      const state = stateManager.getState('agent-1')
      expect(state).toBe('inactive') // Should return default state
    })

    it('should handle removal of non-existent agent', () => {
      expect(() => {
        stateManager.removeAgent('nonexistent')
      }).not.toThrow()
    })
  })

  describe('Recovery Management', () => {
    it('should track recovery attempts', async () => {
      await stateManager.setState('agent-1', 'error')
      
      const attempts = stateManager.getRecoveryAttempts('agent-1')
      expect(attempts).toBe(0)
      
      // Simulate recovery attempt
      stateManager.incrementRecoveryAttempts('agent-1')
      expect(stateManager.getRecoveryAttempts('agent-1')).toBe(1)
    })

    it('should reset recovery attempts on successful recovery', async () => {
      await stateManager.setState('agent-1', 'error')
      stateManager.incrementRecoveryAttempts('agent-1')
      
      await stateManager.setState('agent-1', 'active')
      expect(stateManager.getRecoveryAttempts('agent-1')).toBe(0)
    })

    it('should check if agent can recover', async () => {
      await stateManager.setState('agent-1', 'error')
      
      // Should be able to recover initially
      expect(stateManager.canRecover('agent-1')).toBe(true)
      
      // Exceed recovery attempts
      for (let i = 0; i < config.recoveryAttempts; i++) {
        stateManager.incrementRecoveryAttempts('agent-1')
      }
      
      expect(stateManager.canRecover('agent-1')).toBe(false)
    })
  })

  describe('Event Handling', () => {
    it('should emit agentRegistered event', () => {
      const eventSpy = jest.fn()
      stateManager.on('agentRegistered', eventSpy)
      
      stateManager.registerAgent('agent-1')
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'agent-1'
        })
      )
    })

    it('should emit agentUnregistered event', () => {
      const eventSpy = jest.fn()
      stateManager.on('agentUnregistered', eventSpy)
      
      stateManager.unregisterAgent('agent-1')
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'agent-1'
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid state transitions gracefully', async () => {
      // This test depends on the implementation's validation logic
      // If there are invalid transitions, they should be handled gracefully
      await expect(
        stateManager.setState('agent-1', 'invalid_state' as AgentState)
      ).resolves.not.toThrow()
    })

    it('should handle concurrent state changes', async () => {
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(stateManager.setState(`agent-${i}`, 'active'))
      }
      
      await expect(Promise.all(promises)).resolves.not.toThrow()
    })
  })
})
