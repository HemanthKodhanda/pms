import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native'
import React, { useEffect, useState, useContext } from 'react'
import * as SQLite from 'expo-sqlite'
import { UserContext } from '../UserContext'

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

const ProjectsScreen = ({ route, navigation }) => {
  const { userId, setUserId, userEmail, setUserEmail } = useContext(UserContext)
  const [isModalVisible, setModalVisible] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [projectList, setProjectList] = useState([])

  // Check if the 'projects' table exists, create it if not
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, adminId INTEGER, totalHours INTEGER, totalCost REAL, status TEXT)',
        [],
        () => {
          //  console.log('Table created successfully.')
        },
        (error) => {
          console.log('Error creating table: ', error)
        }
      )
    })
  }, [])

  // Fetch all projects from the 'projects' table
  const fetchProjects = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM projects',
        [],
        (_, { rows }) => {
          if (rows.length > 0) {
            const results = rows._array
            const projectlist = results.map((project) => {
              return {
                id: project.id,
                title: project.title,
                adminid: project.adminId,
                totalHours: project.totalHours,
                totalCost: project.totalCost,
                status: project.status,
              }
            })
            const sortedProjects = projectlist.sort((a, b) => b.id - a.id)
            setProjectList(sortedProjects)
            // console.log(sortedProjects)
          } else {
            Alert.alert('Error', 'No Data available')
          }
        },
        (tx, error) => {
          console.log('Error fetching projects: ', error)
        }
      )
    })
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const projectCount = projectList.length

  const renderItem = ({ item }) => {
    let cardStyle = styles.card
    if (item.status === 'Completed') {
      cardStyle = { ...cardStyle, ...styles.completedCard }
    } else {
      cardStyle = { ...cardStyle, ...styles.inProgressCard }
    }

    const isCompleted = item.status === 'Completed'

    return (
      <View style={cardStyle}>
        <View style={styles.projectContainer}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text>Admin: {item.adminid}</Text>
          <Text>Total Hours: {item.totalHours}</Text>
          <Text>Total Cost: ${item.totalCost}</Text>
          <Text>Total Tasks: {item.totalTasks}</Text>
          <Text>In-Progress Tasks: {item.inprogressTasks}</Text>
          <Text>Compleetd Tasks: {item.completedTasks}</Text>
          <Text>Status: {item.status}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => {}} style={styles.cardbuttonTasks}>
              <Text style={styles.buttonTextTasks}>Tasks</Text>
            </TouchableOpacity>
            {!isCompleted && (
              <TouchableOpacity
                onPress={() => {}}
                style={styles.cardbuttonComplete}
                disabled={isCompleted}
              >
                <Text style={styles.buttonText}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }

  const handleComplete = (project) => {
    // Logic to handle completion of the project
    console.log(`Complete project: ${project.title}`)
  }

  const handleTasks = (project) => {
    // Logic to handle tasks of the project
    console.log(`View tasks of project: ${project.title}`)
  }

  const toggleModal = () => {
    setModalVisible(!isModalVisible)
  }

  const handleAddProject = () => {
    const trimmedTitle = newProjectTitle.trim()

    if (trimmedTitle.length === 0) {
      console.log('Project title is empty.')
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO projects (title, adminId, totalHours, totalCost, status) VALUES (?, ?, ?, ?, ?)',
        [trimmedTitle, parseInt(userId, 10), 0, 0, 'In Progress'],
        (_, { insertId }) => {
          console.log('Project inserted successfully. Insert ID: ', insertId)
          console.log('adminID:::', userId)
          // Reset the new project title and close the modal
          setNewProjectTitle('')
          toggleModal()
          fetchProjects() // Refresh the project list
        },
        (error) => {
          console.log('Error inserting project: ', error)
        }
      )
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Projects ({projectCount})</Text>
        <TouchableOpacity onPress={toggleModal} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={projectList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />

      {/* Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Project</Text>
            <TextInput
              style={styles.input}
              placeholder="Project Title"
              value={newProjectTitle}
              onChangeText={setNewProjectTitle}
            />
            <TouchableOpacity
              style={[
                styles.modalButton,
                newProjectTitle ? null : styles.disabledModalButton,
              ]}
              onPress={handleAddProject}
              disabled={!newProjectTitle}
            >
              <Text style={styles.modalButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={toggleModal}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default ProjectsScreen

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
  cardbuttonComplete: {
    backgroundColor: '#009900',
    width: '30%',
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
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
    padding: 20,
    margin: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
    color: '#000000',
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
})
