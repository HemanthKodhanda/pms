import React, { useEffect, useState, useRef, useContext } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { UserContext } from '../UserContext'
import * as SQLite from 'expo-sqlite'
import RNPickerSelect from 'react-native-picker-select'
import DateTimePicker from '@react-native-community/datetimepicker'

function openDatabase() {
  if (Platform.OS === 'web') {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        }
      },
    }
  }

  const db = SQLite.openDatabase('db.db')
  return db
}

const db = openDatabase()

const ProjectTasksScreen = () => {
  const { userId, setUserId, userEmail, setUserEmail, isAdmin, setIsAdmin } =
    useContext(UserContext)
  const route = useRoute()
  const navigation = useNavigation()
  const { projid } = route.params
  const [projectName, setProjectName] = useState('')
  const [projectTasks, setProjectTasks] = useState([])
  const [isModalVisible, setModalVisible] = useState(false)
  const titleInputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [selectedDependencyTask, setSelectedDependencyTask] = useState(0)
  const [assignedTo, setAssignedTo] = useState('')
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [hourlyRate, setHourlyRate] = useState('')
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [hoursWorked, setHoursWorked] = useState('')
  const [currentHours, setcurrentHours] = useState('')
  const [tasksCount, setTasksCount] = useState('')

  // Fetch all Tasks from the 'Tasks' table
  const fetchTasks = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT Tasks.*, DepTasks.id as DepTaskId, DepTasks.title as DepTaskTitle, DepTasks.status as DepTaskStatus,
         projects.id as projectid, projects.title as project, users.email as email, users1.email as completedBy 
         FROM tasks as Tasks
         LEFT JOIN Tasks as DepTasks ON Tasks.dependencyTaskId = DepTasks.id
         INNER JOIN projects ON Tasks.projectId = projects.id
         INNER JOIN Users ON Tasks.assignedToUserId = users.id
         LEFT JOIN Users as users1 ON Tasks.completedByUserId = users1.id
         WHERE Tasks.projectId = ?`,
        [projid],
        (_, { rows }) => {
          if (rows.length > 0) {
            const results = rows._array
            // console.log(results)
            const taskslist = results.map((task) => {
              return {
                id: task.id,
                title: task.title,
                projectid: task.projectid,
                project: task.project,
                deptaskid: task.DepTaskId,
                deptasktitle: task.DepTaskTitle,
                deptaskstatus: task.DepTaskStatus,
                assignedTo: task.assignedToUserId,
                email: task.email,
                status: task.status,
                hourlyrate: task.hourlyRate,
                hoursworked: task.hoursWorked,
                cost: task.totalCost,
                startDate: new Date(task.startDate).toLocaleDateString(),
                endDate: new Date(task.endDate).toLocaleDateString(),
                createdByUserId: task.createdByUserId,
                completedByUserId: task.completedByUserId,
                completedBy: task.completedBy,
                completedDateTime: task.completedDateTime,
              }
            })
            const sortedTasks = taskslist.sort((a, b) => b.id - a.id)
            setProjectTasks('')
            setProjectTasks(sortedTasks)
            setTasksCount(sortedTasks.length)
          } else {
            // Alert.alert('Error', 'No Data available')
          }
        },
        (tx, error) => {
          console.log('Error fetching Tasks: ', error)
        }
      )
      // get project title
      tx.executeSql(
        `SELECT * FROM projects
         WHERE id = ?`,
        [projid],
        (_, { rows }) => {
          if (rows.length > 0) {
            const results = rows._array
            setProjectName('')
            const proHeader = 'ID' + results[0].id + '#' + results[0].title
            setProjectName(proHeader)
          } else {
            // Alert.alert('Error', 'No Data available')
          }
        },
        (tx, error) => {
          console.log('Error fetching : ', error)
        }
      )
    })
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    fetchProjects()
    fetchUsers()
    if (isModalVisible) {
      titleInputRef.current.focus()
    }
  }, [isModalVisible])

  const toggleTaskModal = () => {
    setModalVisible(!isModalVisible)
    // Reset the form fields
    setTitle('')
    setDescription('')
    setProjectId('')
    setStartDate(new Date())
    setEndDate(new Date())
    setHourlyRate('')
    setAssignedTo('')
  }

  // Fetch all projects from the 'projects' table
  const fetchProjects = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT projects.*, users.email as email 
         FROM projects
         INNER JOIN users ON projects.adminId = users.id
         WHERE projects.adminId = ?
         AND projects.status != 'Completed'`,
        [userId],
        (_, { rows }) => {
          if (rows.length > 0) {
            const results = rows._array
            const projectlist = results.map((project) => {
              return {
                id: project.id,
                title: project.title,
                adminid: project.adminId,
                adminemail: project.email,
                totalHours: project.totalHours,
                totalCost: project.totalCost,
                status: project.status,
              }
            })
            const sortedProjects = projectlist.sort((a, b) => b.id - a.id)
            setProjects(sortedProjects)
            // console.log(sortedProjects)
          } else {
            // Alert.alert('Error', 'No Data available')
          }
        },
        (tx, error) => {
          console.log('Error fetching projects: ', error)
        }
      )
    })
  }

  const fetchUsers = () => {
    // Fetch users from the users table and set the users state
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM users',
        [],
        (_, { rows }) => {
          if (rows.length > 0) {
            const results = rows._array

            const userslist = results.map((user) => {
              return {
                id: user.id,
                email: user.email,
              }
            })
            const sortedUsers = userslist.sort((a, b) => b.id - a.id)

            // console.log(sortedUsers)
            setUsers(sortedUsers)
          } else {
            // Alert.alert('Error', 'No Data available')
          }
        },
        (tx, error) => {
          console.log('Error fetching users: ', error)
        }
      )
    })
  }

  const handleStartDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false)
    }
    setStartDate(date || startDate)
  }

  const handleEndDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false)
    }
    setEndDate(date || endDate)
  }

  const showStartDatePickerModal = () => {
    setShowStartDatePicker(true)
  }

  const showEndDatePickerModal = () => {
    setShowEndDatePicker(true)
  }

  const handleCreateTask = () => {
    if (
      title.trim() === '' ||
      description.trim() === '' ||
      projectId === '' ||
      startDate === '' ||
      endDate === '' ||
      hourlyRate === '' ||
      assignedTo === ''
    ) {
      Alert.alert(
        'Missing Details',
        'Please enter all the details of the task.'
      )
    } else {
      // Create a new task with the entered details
      const newTask = {
        title,
        description,
        projectId,
        selectedDependencyTask,
        startDate,
        endDate,
        createdByUserId: userId,
        assignedTo,
        completedByUserId: '',
        completedDateTime: '',
        status: 'In Progress',
        hourlyRate,
        hoursWorked: 0,
        totalCost: 0,
      }

      // Insert the new task into the tasks table
      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO tasks (title, description, projectId, dependencyTaskId, startDate, endDate, createdByUserId, assignedToUserId, 
                            completedByUserId, completedDateTime, status, hourlyRate, hoursWorked, totalCost )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newTask.title,
            newTask.description,
            newTask.projectId,
            newTask.selectedDependencyTask,
            newTask.startDate.toISOString(),
            newTask.endDate.toISOString(),
            newTask.createdByUserId,
            newTask.assignedTo,
            newTask.completedByUserId,
            newTask.completedDateTime,
            newTask.status,
            newTask.hourlyRate,
            newTask.hoursWorked,
            newTask.totalCost,
          ],
          (tx, results) => {
            // Task inserted successfully
            console.log('New task inserted with ID: ', results.insertId)
          },
          (tx, error) => {
            // Error occurred while inserting task
            console.log('Error inserting task: ', error)
          }
        )
      })

      // Reset the form fields
      setTitle('')
      setDescription('')
      setProjectId('')
      setStartDate(new Date())
      setEndDate(new Date())
      setHourlyRate('')
      setAssignedTo('')
      // Close the modal
      toggleTaskModal()
      fetchTasks()
      fetchProjects()
      fetchUsers()
    }
  }

  const handleProjectChange = (projectid) => {
    setProjectId(projectid)
    //selectedDependencyTask(0) // Reset selected dependency when project changes
  }

  const handleDeleteTask = (taskId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => onDelete(taskId) },
      ]
    )
  }

  const onDelete = (taskId) => {
    // Perform deletion logic based on the taskId
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM tasks WHERE id = ?',
        [taskId],
        (tx, results) => {
          // Task deleted successfully
          // console.log('Task deleted')
        },
        (tx, error) => {
          console.log('Error executing query:', error)
        }
      )
    })
    // Update the tasks state to reflect the changes
    fetchTasks()
  }

  const renderItem = ({ item }) => {
    let cardStyle = styles.card
    if (item.status === 'Completed') {
      cardStyle = { ...cardStyle, ...styles.completedCard }
    } else {
      cardStyle = { ...cardStyle, ...styles.inProgressCard }
    }

    const isCompleted = item.status === 'Completed'
    const isAssigned = item.assignedTo === userId
    const shouldHideAddButton = isAdmin ? true : false

    return (
      <View style={cardStyle}>
        <View style={styles.projectContainer}>
          <View>
            <Text style={styles.titleText}>
              Task#{item.id} {item.title}
            </Text>
            <Text>
              Project#{item.projectid}: {item.project}
            </Text>
            <Text>Assigned To: {item.email}</Text>
            <Text>Start Date: {item.startDate}</Text>
            <Text>End Date: {item.endDate}</Text>
            <Text>Hourly Rate: {item.hourlyrate}</Text>
            <Text>Hours Worked: {item.hoursworked}</Text>
            <Text>Cost: ${item.cost}</Text>
            <Text>Status: {item.status}</Text>
            {isCompleted && <Text>Completed By: {item.completedBy}</Text>}
            {isCompleted && <Text>Completed At: {item.completedDateTime}</Text>}
            {item.deptaskid && (
              <View style={styles.dependencyContainer}>
                <Text style={styles.dependencyLabel}>Dependency:</Text>
                <Text>
                  TaskId {item.deptaskid} :: {item.deptasktitle}
                </Text>
                <Text style={styles.dependencyDescription}>
                  Task Status: {item.deptaskstatus}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.buttonContainer}>
            {!isCompleted && (isAssigned || isAdmin) && (
              <TouchableOpacity
                //onPress={toggleAddHoursModal}
                onPress={() => handleDeleteTask(item.id)}
                style={styles.cardbuttonDelete}
              >
                <Text style={styles.buttonTextDelete}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View>
        <Text>
          Hello {userEmail} {isAdmin ? <Text>(Admin)</Text> : null}
        </Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>
          {projectName} Tasks ({tasksCount})
        </Text>

        <TouchableOpacity onPress={toggleTaskModal} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={projectTasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />

      {/* Add Task Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Task</Text>
            <TextInput
              style={[styles.input, { color: 'black' }]}
              ref={titleInputRef}
              placeholder="Title*"
              placeholderTextColor="gray"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { color: 'black' }]}
              placeholder="Description*"
              placeholderTextColor="gray"
              value={description}
              onChangeText={setDescription}
            />
            <TouchableOpacity
              style={styles.dateInput}
              onPress={showStartDatePickerModal}
            >
              <Text style={styles.dateInputLabel}>Start Date*</Text>
              <Text>{startDate.toDateString()}</Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
              />
            )}
            <TouchableOpacity
              style={styles.dateInput}
              onPress={showEndDatePickerModal}
            >
              <Text style={styles.dateInputLabel}>End Date*</Text>
              <Text>{endDate.toDateString()}</Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
              />
            )}
            <TextInput
              style={[styles.input, { color: 'black' }]}
              placeholder="Hourly Rate*"
              placeholderTextColor="gray"
              value={hourlyRate}
              onChangeText={setHourlyRate}
            />
            <RNPickerSelect
              items={projects.map((project) => ({
                label: project.title,
                value: project.id,
              }))}
              onValueChange={(value) => handleProjectChange(value)}
              placeholder={{ label: 'Select Project*', value: null }}
              value={projectId}
              style={pickerSelectStyles}
            />
            <RNPickerSelect
              items={
                projectTasks && projectTasks.length > 0
                  ? projectTasks.map((ptask) => ({
                      label: 'Task#' + ptask.id + ':: ' + ptask.title,
                      value: ptask.id,
                    }))
                  : [{ label: 'No tasks available', value: 0 }]
              }
              onValueChange={(value) => setSelectedDependencyTask(value)}
              placeholder={{ label: 'Select Dependency', value: null }}
              value={selectedDependencyTask}
              style={pickerSelectStyles}
            />
            <RNPickerSelect
              items={users.map((user) => ({
                label: user.email,
                value: user.id,
              }))}
              onValueChange={(value) => setAssignedTo(value)}
              placeholder={{ label: 'Select User*', value: null }}
              value={assignedTo}
              style={pickerSelectStyles}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={toggleTaskModal}
              >
                <Text style={styles.cancelButtonLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleCreateTask}
              >
                <Text style={styles.addButtonLabel}>Create Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

export default ProjectTasksScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#0782F9',
    width: '20%',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  projectContainer: {
    padding: 10,
  },
  list: {
    marginTop: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  completedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#009900',
  },
  inProgressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCC00',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardbuttonTasks: {
    borderWidth: 1,
    borderColor: '#0782F9',
    width: '30%',
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonTextTasks: {
    color: '#0782F9',
    fontWeight: '700',
    fontSize: 16,
  },
  cardbuttonDelete: {
    borderWidth: 1,
    borderColor: 'red',
    width: '30%',
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonTextDelete: {
    color: 'red',
    fontWeight: '700',
    fontSize: 16,
  },
  cardbuttonComplete: {
    borderWidth: 1,
    borderColor: '#009900',
    width: '30%',
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonTextComplete: {
    color: '#009900',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  disabledButtonTitle: {
    color: 'gray',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'gray',
    padding: 20,
    margin: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
    marginTop: 8,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledModalButton: {
    opacity: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  addButton: {
    backgroundColor: '#0782F9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  dateInput: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    backgroundColor: 'white',
    marginBottom: 4,
  },
  dateInputLabel: {
    fontSize: 16,
    color: 'gray',
  },
  toggleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  dependencyContainer: {
    marginTop: 16,
  },
  dependencyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dependencyTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  dependencyDescription: {
    fontSize: 12,
    color: '#888888',
  },
})

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
    marginTop: 8,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
    marginTop: 8,
  },
  placeholder: {
    color: 'gray',
  },
}
