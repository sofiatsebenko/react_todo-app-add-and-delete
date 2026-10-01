/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */

import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';

import { UserWarning } from './UserWarning';
import {
  addTodos,
  changeTodos,
  deleteTodos,
  editTodos,
  getTodos,
  USER_ID,
} from './api/todos';

import { FilterType, Todo } from './types/Todo';

import { NewTodo } from './components/NewTodo/NewTodo';
import { TodoList } from './components/TodoList/TodoList';
import { Filter } from './components/Filter/Filter';
import { Todo as TodoComp } from './components/Todo/Todo';

export const App: React.FC = () => {
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [edit, setEdit] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const newTodoFieldRef = useRef<HTMLInputElement>(null);

  const showError = (message: string) => {
    setError(message);

    setTimeout(() => {
      setError('');
    }, 3000);
  };

  const hideError = () => {
    setError('');
  };

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => {
        showError('Unable to load todos');
      });
  }, []);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const visibleTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;

      case 'completed':
        return todo.completed;

      default:
        return true;
    }
  });

  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  const addLoadingTodoId = (id: number) => {
    setLoadingTodoIds(currentIds => [...currentIds, id]);
  };

  const removeLoadingTodoId = (id: number) => {
    setLoadingTodoIds(currentIds =>
      currentIds.filter(currentId => currentId !== id),
    );
  };

  const toggleTodo = (todo: Todo) => {
    if (loadingTodoIds.length > 0 || loadingAdd) {
      return;
    }

    hideError();
    addLoadingTodoId(todo.id);

    changeTodos(todo)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.map(currentTodo =>
            currentTodo.id === todo.id
              ? { ...currentTodo, completed: !todo.completed }
              : currentTodo,
          ),
        );
      })
      .catch(() => {
        showError('Unable to update a todo');
      })
      .finally(() => {
        removeLoadingTodoId(todo.id);
      });
  };

  const handleToggleAll = () => {
    if (loadingTodoIds.length > 0 || loadingAdd || todos.length === 0) {
      return;
    }

    const shouldCompleteAll = todos.some(todo => !todo.completed);

    const todosToChange = todos.filter(
      todo => todo.completed !== shouldCompleteAll,
    );

    const loadingIds = todosToChange.map(todo => todo.id);

    hideError();
    setLoadingTodoIds(loadingIds);

    Promise.all(todosToChange.map(todo => changeTodos(todo)))
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.map(todo =>
            loadingIds.includes(todo.id)
              ? { ...todo, completed: shouldCompleteAll }
              : todo,
          ),
        );
      })
      .catch(() => {
        showError('Unable to update todos');
      })
      .finally(() => {
        setLoadingTodoIds([]);
      });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      showError('Title should not be empty');

      return;
    }

    if (loadingTodoIds.length > 0 || loadingAdd) {
      return;
    }

    const newTodo = {
      id: 0,
      title: trimmedTitle,
      completed: false,
      userId: USER_ID,
    };

    setTempTodo(newTodo);
    hideError();
    setLoadingAdd(true);

    addTodos(trimmedTitle)
      .then(createdTodo => {
        setTodos(currentTodos => [...currentTodos, createdTodo]);
        setTitle('');
      })
      .catch(() => {
        showError('Unable to add a todo');
      })
      .finally(() => {
        setTempTodo(null);
        setLoadingAdd(false);

        setTimeout(() => {
          newTodoFieldRef.current?.focus();
        }, 0);
      });
  };

  const handleEditClick = (todo: Todo) => {
    if (loadingTodoIds.length > 0 || loadingAdd) {
      return;
    }

    hideError();
    setEditTitle(todo.title);
    setEdit(todo.id);
  };

  const handleEdit = (todo: Todo) => {
    if (loadingTodoIds.length > 0 || loadingAdd) {
      return;
    }

    const trimmedTitle = editTitle.trim();

    hideError();
    addLoadingTodoId(todo.id);

    if (!trimmedTitle) {
      deleteTodos(todo)
        .then(() => {
          setTodos(currentTodos =>
            currentTodos.filter(currentTodo => currentTodo.id !== todo.id),
          );

          setEdit(null);
          setEditTitle('');
        })
        .catch(() => {
          showError('Unable to delete a todo');
        })
        .finally(() => {
          removeLoadingTodoId(todo.id);
        });

      return;
    }

    editTodos(todo, trimmedTitle)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.map(currentTodo =>
            currentTodo.id === todo.id
              ? { ...currentTodo, title: trimmedTitle }
              : currentTodo,
          ),
        );

        setEdit(null);
        setEditTitle('');
      })
      .catch(() => {
        showError('Unable to update a todo');
      })
      .finally(() => {
        removeLoadingTodoId(todo.id);
      });
  };

  const handleDelete = (todo: Todo) => {
    if (loadingTodoIds.length > 0 || loadingAdd) {
      return;
    }

    hideError();
    addLoadingTodoId(todo.id);

    deleteTodos(todo)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(currentTodo => currentTodo.id !== todo.id),
        );
      })
      .catch(() => {
        showError('Unable to delete a todo');
      })
      .finally(() => {
        removeLoadingTodoId(todo.id);

        setTimeout(() => {
          newTodoFieldRef.current?.focus();
        }, 0);
      });
  };

  const handleClearCompleted = () => {
    if (loadingTodoIds.length > 0 || loadingAdd) {
      return;
    }

    const completedTodos = todos.filter(todo => todo.completed);

    if (completedTodos.length === 0) {
      return;
    }

    const completedIds = completedTodos.map(todo => todo.id);

    hideError();
    setLoadingTodoIds(completedIds);

    Promise.allSettled(completedTodos.map(todo => deleteTodos(todo)))
      .then(results => {
        const successfullyDeletedIds = completedTodos
          .filter((_, index) => results[index].status === 'fulfilled')
          .map(todo => todo.id);

        setTodos(currentTodos =>
          currentTodos.filter(
            todo => !successfullyDeletedIds.includes(todo.id),
          ),
        );

        if (successfullyDeletedIds.length !== completedTodos.length) {
          showError('Unable to delete a todo');
        }
      })
      .finally(() => {
        setLoadingTodoIds([]);

        setTimeout(() => {
          newTodoFieldRef.current?.focus();
        }, 0);
      });
  };

  const handleFilter = (
    event: React.MouseEvent<HTMLAnchorElement>,
    newFilter: FilterType,
  ) => {
    event.preventDefault();
    setFilter(newFilter);
  };

  const allCompleted = todos.length > 0 && todos.every(todo => todo.completed);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className={cn('todoapp__toggle-all', {
              active: allCompleted,
            })}
            data-cy="ToggleAllButton"
            onClick={handleToggleAll}
            disabled={
              loadingTodoIds.length > 0 || loadingAdd || todos.length === 0
            }
          />

          <NewTodo
            title={title}
            setTitle={setTitle}
            handleSubmit={handleSubmit}
            loadingAdd={loadingAdd}
            inputRef={newTodoFieldRef}
          />
        </header>

        {todos.length > 0 && (
          <TodoList
            edit={edit}
            editTitle={editTitle}
            visibleTodos={visibleTodos}
            toggleTodo={toggleTodo}
            loadingTodoIds={loadingTodoIds}
            handleEdit={handleEdit}
            setEditTitle={setEditTitle}
            handleEditClick={handleEditClick}
            handleDelete={handleDelete}
          />
        )}

        {tempTodo && (
          <TodoComp
            todo={tempTodo}
            edit={edit}
            editTitle={editTitle}
            toggleTodo={toggleTodo}
            loadingTodoIds={loadingAdd ? [0] : []}
            handleEdit={handleEdit}
            setEditTitle={setEditTitle}
            handleEditClick={handleEditClick}
            handleDelete={handleDelete}
          />
        )}

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {activeTodosCount} items left
            </span>

            <Filter filter={filter} handleFilter={handleFilter} />

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={
                !todos.some(todo => todo.completed) ||
                loadingTodoIds.length > 0 ||
                loadingAdd
              }
              onClick={handleClearCompleted}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          {
            hidden: !error,
          },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={hideError}
        />

        {error}
      </div>
    </div>
  );
};
