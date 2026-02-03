import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Variable, Plus } from 'lucide-react';
import { TEMPLATE_VARIABLES } from '@/hooks/useNotificationTemplatesData';

interface VariablesListProps {
  onInsert: (variable: string) => void;
}

const VariablesList = ({ onInsert }: VariablesListProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Variable className="w-4 h-4" />
          Variables disponibles
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Cliquez sur une variable pour l'insérer
        </p>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_VARIABLES.map((variable) => (
              <Tooltip key={variable.key}>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onInsert(variable.key)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {variable.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{variable.key}</p>
                  <p className="text-xs text-muted-foreground">{variable.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default VariablesList;
