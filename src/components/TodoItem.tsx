import React, { useState } from 'react';
import { CheckCircle, Circle, Trash, Edit, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Todo = Database['public']['Tables']['todos']['Row'];

type TodoItemProps = {
  todo: Todo;
  onDelete: (id: string) => void;
};

export function TodoItem({ todo, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [task, setTask] = useState(todo.task);
  const [isComplete, setIsComplete] = useState(todo.is_complete);
  const [isLoading, setIsLoading] = useState(false);

  const toggleComplete = async () => {
    try {
      setIsLoading(true);
      const newStatus = !isComplete;
      const { error } = await supabase
        .from('todos')
        .update({ is_complete: newStatus })
        .eq('id', todo.id);
      if (error) throw error;
      setIsComplete(newStatus);
    } catch (err) {
      console.error('Error updating todo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('todos')
        .update({ task })
        .eq('id', todo.id);
      if (error) throw error;
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating todo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => onDelete(todo.id);

  return (
    <div
      className={`
        flex items-center p-3 rounded-lg mb-2 group transition-all
        ${isComplete
          ? 'bg-primary-light/20 border border-primary-light'
          : 'bg-neutral-100 border border-neutral-200'}
      `}
    >
      <button
        onClick={toggleComplete}
        disabled={isLoading}
        className="
          flex-shrink-0 
          text-neutral-500 
          hover:text-primary 
          transition-colors
        "
      >
        {isComplete ? (
          <CheckCircle className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="ml-3 flex-1">
        {isEditing ? (
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="
              w-full px-2 py-1 
              bg-neutral-100 border border-neutral-200 
              rounded-md text-sm
              text-neutral-700 placeholder-neutral-500
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            "
            autoFocus
          />
        ) : (
          <p
            className={`
              text-sm 
              ${isComplete
                ? 'line-through text-neutral-500'
                : 'text-neutral-700'}
            `}
          >
            {todo.task}
          </p>
        )}
      </div>

      <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <button
              onClick={updateTask}
              disabled={isLoading}
              className="
                p-1 rounded 
                hover:bg-neutral-200 
                text-primary 
                transition-colors
              "
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setTask(todo.task);
              }}
              className="
                p-1 rounded 
                hover:bg-neutral-200 
                text-neutral-500 
                transition-colors
              "
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="
                p-1 rounded 
                hover:bg-neutral-200 
                text-primary 
                transition-colors
              "
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="
                p-1 rounded 
                hover:bg-neutral-200 
                text-accent 
                transition-colors
              "
            >
              <Trash className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
