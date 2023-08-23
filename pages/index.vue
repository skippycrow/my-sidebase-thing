<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>My Tasks</ion-title>
        <ion-buttons slot="end">
          <ion-button id="open-filter-modal"> Filter </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <ion-list>
        <ion-item-sliding v-for="task in filteredTasks" :key="task.id">
          <ion-item-options side="start">
            <ion-item-option color="danger" @click="deleteTask(task.id)">
              Delete
            </ion-item-option>
          </ion-item-options>
          <ion-item>
            <ion-label>
              <h2>{{ task.description }}</h2>
              <p>{{ task.details }}</p>
              <p>{{ task.status }}</p>
            </ion-label>
          </ion-item>
          <ion-item-options side="end" v-if="task.status == 'open'">
            <ion-item-option color="success" @click="completeTask(task.id)">
              Close
            </ion-item-option>
          </ion-item-options>
          <ion-item-options side="end" v-if="task.status == 'closed'">
            <ion-item-option color="warning" @click="uncompleteTask(task.id)">
              Reopen
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <p class="pl-4 pt-2 text-gray-600 text-sm">
        Showing {{ filteredTasks.length }} of {{ tasks.data.length }}
      </p>
      <div class="flex flex-col items-center">
        <ion-button id="open-task-modal" class="pt-3"> Add Task </ion-button>
      </div>
    </ion-content>

    <ion-modal ref="addTaskModal" trigger="open-task-modal">
      <!-- add task modal -->

      <ion-header>
        <ion-toolbar>
          <ion-title>Add Task</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeTaskModal"> Close </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list>
          <ion-item lines="none">
            <ion-input
              v-model="workingTask.description"
              label="Description"
              label-placement="floating"
              @ionBlur="markTouched($event)"
              :class="{ 'ion-invalid': errorFlag, 'ion-touched': errorFlag }"
              error-text="Description is required"
            />
          </ion-item>
          <ion-item lines="none">
            <ion-input
              v-model="workingTask.details"
              label="Details"
              label-placement="floating"
              error-text="Description is required"
            />
          </ion-item>
          <ion-item lines="none">
            <ion-select v-model="workingTask.status" label="Status">
              <ion-select-option value="open"> Open </ion-select-option>
              <ion-select-option value="closed"> Closed </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <div class="flex flex-col items-center">
          <ion-button class="pt-3" @click="addTask"> Submit </ion-button>
        </div>
      </ion-content>
    </ion-modal>
    <ion-modal>
      <!-- edit task modal -->
    </ion-modal>
    <ion-modal ref="filterModal" trigger="open-filter-modal">
      <!-- filter modal -->
      <ion-header>
        <ion-toolbar>
          <ion-title>Filter Tasks</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeFilterModal"> Close </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-radio-group v-model="filterValue">
          <ion-item>
            <ion-radio justify="space-between" value="all"> All </ion-radio>
          </ion-item>
          <ion-item>
            <ion-radio justify="space-between" value="open"> Open </ion-radio>
          </ion-item>
          <ion-item>
            <ion-radio justify="space-between" value="closed">
              Closed
            </ion-radio>
          </ion-item>
        </ion-radio-group>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from "vue";

const tasks = ref({ data: [] });
const addTaskModal = ref();
const filterModal = ref();

const filterValue = ref("all");

const workingTask = ref({
  description: "",
  details: "",
  status: "open",
});

const errorFlag = ref(false);

const closeTaskModal = () => addTaskModal.value.$el.dismiss(null, "cancel");
const closeFilterModal = () => filterModal.value.$el.dismiss(null, "cancel");

const getTasks = async () => {
  // get tasks
  tasks.value = await useFetch("/api/tasks");
  console.log(tasks.value);
};

const handleRefresh = (event: CustomEvent) => {
  setTimeout(() => {
    // Any calls to load data go here
    getTasks();
    event.target.complete();
  }, 2000);
};

const addTask = async () => {
  // add task
  if (!validateTask()) {
    errorFlag.value = true;
    return;
  }
  await useFetch("/api/tasks", {
    method: "POST",
    body: workingTask.value,
  });
  workingTask.value = {
    description: "",
    details: "",
    status: "open",
  };
  closeTaskModal();
  getTasks();
};

const deleteTask = async (id: string) => {
  // delete task
  await useFetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });
  getTasks();
};

const validateTask = () => {
  // validate task
  if (workingTask.value.description === "") {
    return false;
  }
  errorFlag.value = false;
  return true;
};

const markTouched = (event: any) => {
  // mark touched
  event.target.classList.add("ion-touched");
};

const completeTask = async (id: string) => {
  //close slider
  const slider = document.querySelector("ion-item-sliding");
  slider.closeOpened();
  // complete task
  await useFetch(`/api/tasks/${id}`, {
    method: "PUT",
    body: {
      status: "closed",
    },
  });

  setTimeout(() => {
    getTasks();
  }, 500);
};

const uncompleteTask = async (id: string) => {
  // uncomplete task

  //close slider
  const slider = document.querySelector("ion-item-sliding");
  await slider.closeOpened();

  await useFetch(`/api/tasks/${id}`, {
    method: "PUT",
    body: {
      status: "open",
    },
  });

  setTimeout(() => {
    getTasks();
  }, 500);
};

const filteredTasks = computed(() => {
  // filter tasks
  if (filterValue.value === "all") {
    return tasks.value.data;
  }
  return tasks.value.data.filter(
    (task: any) => task.status === filterValue.value
  );
});

getTasks();
</script>
