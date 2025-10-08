'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Settings, Trash2 } from 'lucide-react'

interface Agent {
  id: string
  type: string
  name: string
  description: string
  capabilities: string[]
  isActive: boolean
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export default function AgentsAdminPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    const mockAgents: Agent[] = [
      {
        id: '1',
        type: 'financial',
        name: 'Financial Agent',
        description: 'Handles financial operations and cash flow analysis',
        capabilities: ['add_expense', 'add_revenue', 'cashflow_analysis', 'budget_planning'],
        isActive: true,
        config: { model: 'gpt-4o-mini', temperature: 0.7 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        type: 'orchestrator',
        name: 'Agent Orchestrator',
        description: 'Central supervisor for routing messages to appropriate agents',
        capabilities: ['intent_classification', 'agent_routing', 'context_management'],
        isActive: true,
        config: { model: 'gpt-4o-mini', temperature: 0.3 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    setAgents(mockAgents)
    setIsLoading(false)
  }, [])

  const handleToggleAgent = async (agentId: string, isActive: boolean) => {
    // TODO: Implement API call to toggle agent status
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, isActive } : agent
    ))
  }

  const handleCreateAgent = () => {
    setIsCreating(true)
    setEditingAgent({
      id: '',
      type: 'general',
      name: '',
      description: '',
      capabilities: [],
      isActive: true,
      config: {},
      createdAt: '',
      updatedAt: ''
    })
  }

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
  }

  const handleSaveAgent = async (agentData: Agent) => {
    // TODO: Implement API call to save agent
    if (editingAgent?.id) {
      setAgents(prev => prev.map(agent => 
        agent.id === editingAgent.id ? agentData : agent
      ))
    } else {
      setAgents(prev => [...prev, { ...agentData, id: Date.now().toString() }])
    }
    setEditingAgent(null)
    setIsCreating(false)
  }

  const handleDeleteAgent = async (agentId: string) => {
    // TODO: Implement API call to delete agent
    setAgents(prev => prev.filter(agent => agent.id !== agentId))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading agents...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-gray-600">Manage and configure Agent Squad agents</p>
        </div>
        <Button onClick={handleCreateAgent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <div className="grid gap-6">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {agent.name}
                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={agent.isActive}
                    onCheckedChange={(checked) => handleToggleAgent(agent.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAgent(agent)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-gray-600 capitalize">{agent.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Capabilities</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.capabilities.map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Configuration</Label>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(agent.config, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Agent Modal */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Create New Agent' : 'Edit Agent'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({...editingAgent, name: e.target.value})}
                    placeholder="Agent name"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={editingAgent.type}
                    onValueChange={(value) => setEditingAgent({...editingAgent, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="marketing_sales">Marketing & Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="orchestrator">Orchestrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingAgent.description}
                    onChange={(e) => setEditingAgent({...editingAgent, description: e.target.value})}
                    placeholder="Agent description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Capabilities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['add_expense', 'add_revenue', 'cashflow_analysis', 'budget_planning', 'intent_classification', 'agent_routing'].map((capability) => (
                      <Button
                        key={capability}
                        variant={editingAgent.capabilities.includes(capability) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newCapabilities = editingAgent.capabilities.includes(capability)
                            ? editingAgent.capabilities.filter(c => c !== capability)
                            : [...editingAgent.capabilities, capability]
                          setEditingAgent({...editingAgent, capabilities: newCapabilities})
                        }}
                      >
                        {capability}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingAgent(null)
                      setIsCreating(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveAgent(editingAgent)}>
                    {isCreating ? 'Create' : 'Save'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
