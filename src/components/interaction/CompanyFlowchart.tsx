import * as React from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCompanyStore } from '@/stores/company';
import { cn } from '@/lib/utils';

interface CompanyFlowchartProps {
  onNodeClick?: (employeeId: string) => void;
  selectedNodeId?: string | null;
  className?: string;
}

const nodeColors: Record<string, string> = {
  Engineering: '#3b82f6',
  HR: '#10b981',
  Finance: '#f59e0b',
  Marketing: '#ec4899',
  Operations: '#8b5cf6',
  default: '#6b7280',
};

export function CompanyFlowchart({ onNodeClick, selectedNodeId, className }: CompanyFlowchartProps) {
  const activeCompany = useCompanyStore((s) => {
    const company = s.companies.find((c) => c.id === s.activeCompanyId);
    return company || null;
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  React.useEffect(() => {
    if (!activeCompany) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { employees } = activeCompany.structure;
    
    if (employees.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const levelMap = new Map<string, number>();
    const childrenMap = new Map<string, string[]>();

    employees.forEach((emp) => {
      if (emp.reportingTo) {
        const children = childrenMap.get(emp.reportingTo) || [];
        children.push(emp.id);
        childrenMap.set(emp.reportingTo, children);
      }
    });

    const calculateLevel = (id: string): number => {
      if (levelMap.has(id)) return levelMap.get(id)!;
      const emp = employees.find((e) => e.id === id);
      if (!emp || !emp.reportingTo) {
        levelMap.set(id, 0);
        return 0;
      }
      const level = calculateLevel(emp.reportingTo) + 1;
      levelMap.set(id, level);
      return level;
    };

    employees.forEach((emp) => calculateLevel(emp.id));

    const maxLevel = Math.max(...Array.from(levelMap.values()), 0);
    const levelCounts = new Map<number, number>();
    const levelMaxCounts = new Map<number, number>();

    employees.forEach((emp) => {
      const level = levelMap.get(emp.id) || 0;
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    });

    levelCounts.forEach((count, level) => {
      levelMaxCounts.set(level, Math.max(count, levelMaxCounts.get(level) || 0));
    });

    const getLevelNodes = (level: number) => {
      return employees
        .filter((e) => (levelMap.get(e.id) || 0) === level)
        .sort((a, b) => a.name.localeCompare(b.name));
    };

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    for (let level = 0; level <= maxLevel; level++) {
      const levelNodes = getLevelNodes(level);
      const levelWidth = levelMaxCounts.get(level) || 1;
      const spacing = 250;
      const levelSpacing = 150;

      levelNodes.forEach((emp, index) => {
        const xOffset = (levelNodes.length === 1 ? 0 : (index - (levelNodes.length - 1) / 2) * spacing);
        const y = level * levelSpacing;

        newNodes.push({
          id: emp.id,
          position: { x: 400 + xOffset, y },
          data: {
            label: (
              <div className="text-center">
                <div className="font-medium">{emp.name}</div>
                <div className="text-xs text-gray-500">{emp.role}</div>
              </div>
            ),
            employee: emp,
          },
          style: {
            background: nodeColors[emp.department] || nodeColors.default,
            color: 'white',
            border: selectedNodeId === emp.id ? '3px solid #fff' : 'none',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '120px',
            cursor: 'pointer',
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        if (emp.reportingTo) {
          newEdges.push({
            id: `e-${emp.reportingTo}-${emp.id}`,
            source: emp.reportingTo,
            target: emp.id,
            type: 'smoothstep',
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          });
        }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [activeCompany, selectedNodeId, setNodes, setEdges]);

  if (!activeCompany) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <p className="text-muted-foreground">No company selected</p>
      </div>
    );
  }

  if (activeCompany.structure.employees.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <p className="text-muted-foreground">No employees yet. Go to Orchestration to build your company.</p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => onNodeClick?.(node.id)}
      fitView
      className={className}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
}