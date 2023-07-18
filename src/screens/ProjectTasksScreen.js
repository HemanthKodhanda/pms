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
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View>
        <Text>Hello {userEmail}</Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>Project Tasks :: {projectName}</Text>
      </View>
      <FlatList
        data={projectTasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
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
