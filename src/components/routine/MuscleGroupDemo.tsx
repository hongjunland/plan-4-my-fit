import React, { useState } from 'react';
import { MuscleGroup } from '../../types';
import MuscleGroupBadge from './MuscleGroupBadge';
import MuscleGroupSelector from './MuscleGroupSelector';

const MuscleGroupDemo: React.FC = () => {
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>(['chest', 'back']);
  const [singleSelection, setSingleSelection] = useState<MuscleGroup[]>(['arms']);

  const allMuscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body'];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Muscle Group Badges</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">All Muscle Groups (Medium Size)</h3>
            <div className="flex flex-wrap gap-2">
              {allMuscleGroups.map((muscleGroup) => (
                <MuscleGroupBadge key={muscleGroup} muscleGroup={muscleGroup} />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Small Size</h3>
            <div className="flex flex-wrap gap-2">
              {allMuscleGroups.map((muscleGroup) => (
                <MuscleGroupBadge key={muscleGroup} muscleGroup={muscleGroup} size="sm" />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Large Size</h3>
            <div className="flex flex-wrap gap-2">
              {allMuscleGroups.map((muscleGroup) => (
                <MuscleGroupBadge key={muscleGroup} muscleGroup={muscleGroup} size="lg" />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Without Text (Color Dots)</h3>
            <div className="flex flex-wrap gap-2">
              {allMuscleGroups.map((muscleGroup) => (
                <MuscleGroupBadge key={muscleGroup} muscleGroup={muscleGroup} showText={false} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Muscle Group Selector</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Multiple Selection</h3>
            <p className="text-sm text-gray-600 mb-3">Selected: {selectedMuscleGroups.join(', ')}</p>
            <MuscleGroupSelector
              selectedMuscleGroups={selectedMuscleGroups}
              onSelectionChange={setSelectedMuscleGroups}
              multiple={true}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Single Selection</h3>
            <p className="text-sm text-gray-600 mb-3">Selected: {singleSelection.join(', ')}</p>
            <MuscleGroupSelector
              selectedMuscleGroups={singleSelection}
              onSelectionChange={setSingleSelection}
              multiple={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuscleGroupDemo;